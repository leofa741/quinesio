/* eslint-disable */
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from './mongoose';
import UserModel from '../models/User';
import ClienteModel from '../models/Cliente';
import AlertaModel from '../models/Alerta'; // ✅ Nuevo import para alertas
import { NextRequest } from 'next/server';
import LogModel from '../models/LogLogin';
import nodemailer from "nodemailer";

connectDB();

export interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

type ExtendedUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  image: string;
  token: string;
};

// ✅ Función para normalizar teléfono
function normalizeTelefono(text?: string): string | null {
  if (!text) return null;
  const normalized = text
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '');
  return normalized || null;
}

// ✅ Función para normalizar razón social
function normalizeRazonSocial(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// ✅ Función para crear cliente automáticamente
async function crearClienteAutomatico(userData: {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  img?: string;
}) {
  try {
    const clienteExistente = await ClienteModel.findOne({ email: userData.email });
    if (clienteExistente) {
      console.log(`✅ Cliente ya existe para ${userData.email}`);
      return clienteExistente;
    }

    const nombre = (userData.name || 'Usuario').trim();
    const apellido = (userData.lastName || 'Google').trim();
    const razonSocial = `${nombre} ${apellido} ${userData.email}`.trim();
    const razonSocialNormalized = normalizeRazonSocial(razonSocial);

    let telefono: string | null = null;
    let telefonoNormalized: string | null = null;

    const phoneTrimmed = userData.phone?.trim();
    if (phoneTrimmed && phoneTrimmed !== '00000000' && /[\d+]/.test(phoneTrimmed)) {
      telefono = phoneTrimmed;
      telefonoNormalized = normalizeTelefono(phoneTrimmed);
      const yaExiste = await ClienteModel.findOne({ telefonoNormalized });
      if (yaExiste) {
        console.log(`⚠️ Teléfono ${telefonoNormalized} ya existe, omitiendo para ${userData.email}`);
        telefono = null;
        telefonoNormalized = null;
      }
    }

    const clienteData: any = {
      razonSocial,
      razonSocialNormalized,
      nombre,
      apellido,
      email: userData.email,
      direccion: userData.address || '',
      ciudad: userData.city || '',
      provincia: '',
      formaPago: 'efectivo',
      activo: true,
      origen: 'registro_automatico'
    };

    if (telefono && telefonoNormalized) {
      clienteData.telefono = telefono;
      clienteData.telefonoNormalized = telefonoNormalized;
    }

    const nuevoCliente = new ClienteModel(clienteData);
    const clienteGuardado = await nuevoCliente.save();

    //console.log(`✅ Cliente creado para ${userData.email}${telefono ? ` con teléfono` : ' (sin teléfono)'}`);
    return clienteGuardado;

  } catch (error: any) {
    console.error('❌ Error creando cliente automático:', error);

    if (error.code === 11000 || error.statusCode === 409) {
      try {
        console.log('🔄 Reintentando creación SIN teléfono...');
        const nombre = (userData.name || 'Usuario').trim();
        const apellido = (userData.lastName || 'Google').trim();
        const razonSocial = `${nombre} ${apellido} ${userData.email}`.trim();

        const fallbackCliente = await ClienteModel.create({
          razonSocial,
          razonSocialNormalized: normalizeRazonSocial(razonSocial),
          nombre,
          apellido,
          email: userData.email,
          telefono: null,
          telefonoNormalized: null,
          direccion: userData.address || '',
          ciudad: userData.city || '',
          provincia: '',
          formaPago: 'efectivo',
          activo: true,
          origen: 'registro_automatico_fallback'
        });

        // console.log(`✅ Cliente creado en fallback para ${userData.email}`);
        return fallbackCliente;
      } catch (fallbackError) {
        console.error('❌ Fallback también falló:', fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

// === Función para enviar email de login ===
async function sendLoginEmail(to: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.MAILER_SERVICE,
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_SECRET_KEY,
      },
    });

    await transporter.sendMail({
      from: `"Soporte" <${process.env.MAILER_EMAIL}>`,
      to,
      subject: "Nuevo inicio de sesión detectado",
      html: `
        <h2>Hola!</h2>
        <p>Se ha detectado un nuevo inicio de sesión en tu cuenta de Quinesio .</p>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-AR")}</p>
        <br/>
        <p>Si no fuiste vos, cambia tu contraseña de inmediato.</p>
      `,
    });
  } catch (error) {
    console.error("❌ Error enviando email de login:", error);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.ID_GOOGLE as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        await connectDB();
        const user = await UserModel.findOne({ email: credentials?.email });
        if (!user) throw new Error('Usuario no encontrado');
        const isMatch = await bcrypt.compare(credentials!.password, user.password);
        if (!isMatch) throw new Error('Contraseña incorrecta');

        if (user.role === 'user') {
          await crearClienteAutomatico({
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            city: user.city,
            zipCode: user.zipCode,
            img: user.img
          });
        }

        const token = jwt.sign(
          {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            lastName: user.lastName,
            phone: user.phone,
            address: user.address,
            city: user.city,
            zipCode: user.zipCode
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '30d' }
        );

        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
          name: user.name,
          lastName: user.lastName || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          zipCode: user.zipCode || '',
          image: user.img,
          token,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();
      let esUsuarioNuevoGoogle = false;

      if (account?.provider === 'google') {
        let existingUser = await UserModel.findOne({ email: user.email });

        if (!existingUser) {
          esUsuarioNuevoGoogle = true;
          // 👤 Usuario NUEVO con Google
          existingUser = new UserModel({
            name: user.name || '',
            lastName: '',
            phone: '',
            address: '',
            city: '',
            zipCode: '',
            email: user.email,
            img: user.image || '',
            password: await bcrypt.hash('google-auth', 10),
            role: 'user',
            google: true,
          });
          await existingUser.save();

          // ✅ Crear cliente + alerta de bienvenida (UNA SOLA VEZ)
          if (existingUser.role === 'user') {
            const clienteGuardado = await crearClienteAutomatico({
              name: existingUser.name,
              lastName: existingUser.lastName,
              email: existingUser.email,
              phone: existingUser.phone,
              address: existingUser.address,
              city: existingUser.city,
              zipCode: existingUser.zipCode,
              img: existingUser.img
            });

            // 🎁 Bonus: alerta + email de bienvenida
            if (clienteGuardado?._id) {
              try {
                // 1. Crear alerta pre-configurada
                await AlertaModel.create({
                  usuario: existingUser._id,
                  cliente: clienteGuardado._id,
                  tipo: 'busqueda',
                  criterios: {
                    tipoOperacion: 'venta',
                    ubicacion: {
                      ciudad: existingUser.city || 'Buenos Aires',
                      provincia: 'Buenos Aires'
                    }
                  },
                  frecuencia: 'semanal',
                  activo: true
                });

                // 2. Enviar email de bienvenida
                const transporter = nodemailer.createTransport({
                  service: process.env.MAILER_SERVICE || 'gmail',
                  auth: {
                    user: process.env.MAILER_EMAIL,
                    pass: process.env.MAILER_SECRET_KEY,
                  },
                });

                const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

                await transporter.sendMail({
                  from: `"Jimena Sánchez Propiedades" <${process.env.MAILER_EMAIL}>`,
                  to: existingUser.email,
                  subject: '🎁 Bienvenido + Alerta activada',
                  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 650px; margin: 0 auto; background: #0f172a; color: #e2e8f0; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0 0 8px; font-size: 22px; }
    .body { padding: 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .badge { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .cta { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin: 16px 0; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏡 ¡Bienvenido a Jimena Sánchez Propiedades!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 0;">Tu cuenta está lista</p>
  </div>
  <div class="body">
    <p>Hola <strong style="color: white;">${existingUser.name || existingUser.email.split('@')[0]}</strong>,</p>
    <p>Gracias por registrarte. Para ayudarte a encontrar tu propiedad ideal, <strong>ya activamos una alerta personalizada</strong>:</p>
    <div class="card">
      <span class="badge">🔔 Alerta activada</span>
      <p style="margin: 12px 0 0;"><strong>Nuevas propiedades en venta</strong></p>
      <p style="color: #94a3b8; margin: 4px 0 0;">📍 ${existingUser.city || 'Buenos Aires'}, Argentina</p>
      <p style="color: #94a3b8; margin: 4px 0 0;">📅 Frecuencia: Semanal</p>
    </div>
    <p>Recibirás un email cada semana con las propiedades que coincidan con tus intereses. Podés gestionar tus alertas en cualquier momento:</p>
    <div style="text-align: center;">
      <a href="${baseUrl}/perfil/alertas" class="cta">Gestionar mis alertas →</a>
    </div>
    <p style="margin-top: 24px;">¿Necesitás ayuda para empezar? Respondé este email y te contactamos.</p>
  </div>
  <div class="footer">
    <p style="margin: 0 0 8px;"><strong>Jimena Sánchez Propiedades</strong></p>
    <p style="margin: 0;">© ${new Date().getFullYear()} · Buenos Aires, Argentina</p>
  </div>
</body>
</html>`,
                  text: `
Hola ${existingUser.name || existingUser.email.split('@')[0]},

¡Bienvenido a Jimena Sánchez Propiedades!

🔔 Alerta activada:
• Nuevas propiedades en venta
• 📍 ${existingUser.city || 'Buenos Aires'}, Argentina
• 📅 Frecuencia: Semanal

Recibirás un email cada semana con propiedades que coincidan con tus intereses.

Gestionar alertas: ${baseUrl}/perfil/alertas

¿Necesitás ayuda? Respondé este email.

---
Jimena Sánchez Propiedades · Buenos Aires, Argentina
                  `.trim()
                });

                console.log(`✅ Email de bienvenida + alerta enviado a ${existingUser.email}`);
              } catch (alertError) {
                console.error('⚠️ Error creando alerta o enviando email de bienvenida:', alertError);
                // No romper el flujo: el login sigue funcionando
              }
            }
          }

        } else {
          // 👤 Usuario EXISTENTE con Google (pero quizás sin cliente)
          if (existingUser.role === 'user') {
            const clienteGuardado = await crearClienteAutomatico({
              name: existingUser.name,
              lastName: existingUser.lastName,
              email: existingUser.email,
              phone: existingUser.phone,
              address: existingUser.address,
              city: existingUser.city,
              zipCode: existingUser.zipCode,
              img: existingUser.img
            });

            // 🎁 Mismo bonus para usuarios existentes que recién obtienen cliente
            if (clienteGuardado?._id) {
              try {
                // Verificar si ya tiene alertas para no duplicar
                const yaTieneAlertas = await AlertaModel.findOne({
                  usuario: existingUser._id,
                  tipo: 'busqueda',
                  activo: true
                });

                if (!yaTieneAlertas) {
                  await AlertaModel.create({
                    usuario: existingUser._id,
                    cliente: clienteGuardado._id,
                    tipo: 'busqueda',
                    criterios: {
                      tipoOperacion: 'venta',
                      ubicacion: {
                        ciudad: existingUser.city || 'Buenos Aires',
                        provincia: 'Buenos Aires'
                      }
                    },
                    frecuencia: 'semanal',
                    activo: true
                  });
                  console.log(`✅ Alerta creada para usuario existente: ${existingUser.email}`);
                }
              } catch (alertError) {
                console.error('⚠️ Error creando alerta para usuario existente:', alertError);
              }
            }
          }
        }

        // 🔑 Generar token JWT
        const token = jwt.sign(
          {
            id: existingUser.id.toString(),
            email: existingUser.email,
            role: existingUser.role,
            name: existingUser.name,
            lastName: existingUser.lastName,
            phone: existingUser.phone,
            address: existingUser.address,
            city: existingUser.city,
            zipCode: existingUser.zipCode,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '30d' }
        );

        // 🔗 Mapear user para NextAuth
        const u = user as ExtendedUser;
        u.id = existingUser.id.toString();
        u.role = existingUser.role;
        u.token = token;
        u.lastName = existingUser.lastName || '';
        u.phone = existingUser.phone || '';
        u.address = existingUser.address || '';
        u.city = existingUser.city || '';
        u.zipCode = existingUser.zipCode || '';
        u.image = existingUser.img || '';
        u.name = existingUser.name || '';
      }

      // ⬅️ REGISTRO EN BITÁCORA (SOLO ADMIN Y SUPERADMIN)
      try {
        const role =
          (user as any).role ||
          (account?.provider === 'google'
            ? (await UserModel.findOne({ email: user.email }))?.role
            : null);

        if (role === 'admin' || role === 'superadmin' || role === 'vendedor') {
          await LogModel.create({
            email: user.email,
            provider: account?.provider || 'credentials',
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error("Error guardando bitácora:", error);
      }

      // === ✅ Enviar email de login - LÓGICA CORREGIDA ===
      // Enviar SIEMPRE, excepto si es un usuario NUEVO de Google (que ya recibe el email de bienvenida)
      if (!esUsuarioNuevoGoogle) {
        try {
          await sendLoginEmail(user.email as string);
          console.log(`✅ Email de login enviado a ${user.email}`);
        } catch (emailError) {
          console.error('❌ Error enviando email de login:', emailError);
          // No romper el flujo: el login funciona igual
        }
      }

      return true;


    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedUser;
        token.id = u.id;
        token.email = u.email;
        token.role = u.role;
        token.name = u.name;
        token.lastName = u.lastName;
        token.phone = u.phone;
        token.address = u.address;
        token.city = u.city;
        token.zipCode = u.zipCode;
        token.image = u.image;
        token.token = u.token;
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as any;
      session.user.id = t.id;
      session.user.email = t.email;
      session.user.role = t.role;
      session.user.lastName = t.lastName;
      session.user.phone = t.phone;
      session.user.address = t.address;
      session.user.city = t.city;
      session.user.zipCode = t.zipCode;
      session.user.name = t.name;
      session.user.token = t.token || t.accessToken;
      return session;
    },
  },

  secret: process.env.JWT_SECRET,
};

// Helpers de admin
export const verifyAdmin = async (req: NextRequest): Promise<DecodedToken | null> => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
};

export const verifyAdminToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
};