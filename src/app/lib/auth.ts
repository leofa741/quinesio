/* eslint-disable */
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from './mongoose';
import UserModel, { IUser } from '../models/User'; // ✅ Importar modelo + interfaz
import { NextRequest } from 'next/server';
import LogModel from '../models/LogLogin';
import nodemailer from 'nodemailer';

/**
 * Roles disponibles en el sistema
 */
export type UserRole = 'admin' | 'profesionales' | 'administrativos' | 'pacientes';

export interface DecodedToken {
  id: string;
  email: string;
  role: UserRole;
}

type ExtendedUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  image: string;
  token: string;
};

/**
 * Conexión a MongoDB
 */
connectDB();

/**
 * Verifica que JWT_SECRET exista.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno.');
  }
  return secret;
}

/**
 * Normaliza el rol que viene desde MongoDB.
 */
function normalizeRole(role?: string): UserRole {
  const normalized = role?.trim().toLowerCase();
  
  switch (normalized) {
    case 'admin': return 'admin';
    case 'profesionales': return 'profesionales';
    case 'administrativos': return 'administrativos';
    case 'pacientes': return 'pacientes';
    case 'user': return 'pacientes'; // Compatibilidad
    default:
      if (role && role !== 'pacientes') {
        console.warn(`⚠️ Role no reconocido: "${role}" → asignando 'pacientes'`);
      }
      return 'pacientes';
  }
}

/**
 * Envía un email avisando que hubo un inicio de sesión.
 */
async function sendLoginEmail(to: string): Promise<void> {
  try {
    if (!process.env.MAILER_EMAIL || !process.env.MAILER_SECRET_KEY) {
      console.warn('⚠️ MAILER no configurado. Se omite email de login.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.MAILER_SERVICE || 'gmail',
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_SECRET_KEY,
      },
    });

    await transporter.sendMail({
      from: `"Centro de Kinesiología" <${process.env.MAILER_EMAIL}>`,
      to,
      subject: 'Nuevo inicio de sesión detectado',
      html: `
        <h2>Nuevo inicio de sesión</h2>
        <p>Se detectó un nuevo inicio de sesión en tu cuenta del Centro de Kinesiología.</p>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
        <br/>
        <p>Si no fuiste vos, verificá tu cuenta y cambiá tu contraseña.</p>
      `,
    });
  } catch (error) {
    console.error('❌ Error enviando email de login:', error);
  }
}

/**
 * Genera nuestro JWT interno.
 */
function generateJwt(user: { id: string; email: string; role: UserRole }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
}

/**
 * Helper seguro para obtener _id como string (evita errores de TypeScript)
 */
function getUserId(user: IUser | null): string {
  if (!user?._id) return '';
  // Maneja tanto ObjectId como string
  return typeof user._id === 'string' ? user._id : (user._id as mongoose.Types.ObjectId).toString();
}

/**
 * Configuración de NextAuth
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.ID_GOOGLE as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        await connectDB();

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son obligatorios');
        }

        const email = credentials.email.trim().toLowerCase();

        // ✅ CORREGIDO: Tipar explícitamente + usar helper para _id
        const user = await UserModel.findOne({ email }).lean() as IUser | null;

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        if (!user.password) {
          throw new Error('Esta cuenta no tiene una contraseña configurada.');
        }

        const passwordCorrecta = await bcrypt.compare(credentials.password, user.password);
        if (!passwordCorrecta) {
          throw new Error('Contraseña incorrecta');
        }

        const role = normalizeRole(user.role);
        const token = generateJwt({
          id: getUserId(user), // ✅ Helper seguro
          email: user.email,
          role,
        });

        return {
          id: getUserId(user),
          email: user.email,
          role,
          name: user.name || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          zipCode: user.zipCode || '',
          image: user.img || '',
          token,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      if (account?.provider === 'google') {
        if (!user.email) {
          console.error('❌ Google no devolvió email.');
          return false;
        }

        const email = user.email.trim().toLowerCase();

        // ✅ CORREGIDO: Tipar explícitamente + helper para _id
        let existingUser = await UserModel.findOne({ email }).lean() as IUser | null;

        if (!existingUser) {
          existingUser = await UserModel.create({
            name: user.name || '',
            lastName: '',
            phone: '',
            address: '',
            city: '',
            zipCode: '',
            email,
            img: user.image || '',
            password: await bcrypt.hash(`google-auth-${email}`, 10),
            role: 'pacientes',
            google: true,
            activo: true,
          }) as IUser;
        }

        const role = normalizeRole(existingUser.role);

        if (existingUser.role !== role) {
          existingUser.role = role;
          await UserModel.findByIdAndUpdate(getUserId(existingUser), { role });
        }

        const token = generateJwt({
          id: getUserId(existingUser), // ✅ Helper seguro
          email: existingUser.email,
          role,
        });

        const u = user as ExtendedUser;
        u.id = getUserId(existingUser);
        u.email = existingUser.email;
        u.role = role;
        u.token = token;
        u.name = existingUser.name || '';
        u.lastName = existingUser.lastName || '';
        u.phone = existingUser.phone || '';
        u.address = existingUser.address || '';
        u.city = existingUser.city || '';
        u.zipCode = existingUser.zipCode || '';
        u.image = existingUser.img || '';
      }

      // Bitácora
      try {
        let role: UserRole | null = null;
        if (user?.role) {
          role = normalizeRole(user.role);
        } else if (user?.email) {
          const existingUser = await UserModel.findOne({ email: user.email }).lean() as IUser | null;
          if (existingUser) {
            role = normalizeRole(existingUser.role);
          }
        }

        if (role === 'admin' || role === 'profesionales' || role === 'administrativos') {
          await LogModel.create({
            email: user.email,
            provider: account?.provider || 'credentials',
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('⚠️ Error guardando bitácora:', error);
      }

      // Email de login
      if (user?.email) {
        await sendLoginEmail(user.email);
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedUser;
        token.id = u.id;
        token.email = u.email;
        token.role = normalizeRole(u.role);
        token.name = u.name || '';
        token.lastName = u.lastName || '';
        token.phone = u.phone || '';
        token.address = u.address || '';
        token.city = u.city || '';
        token.zipCode = u.zipCode || '';
        token.picture = u.image || '';
        token.token = u.token;
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as typeof token & {
        id?: string;
        role?: string;
        lastName?: string;
        phone?: string;
        address?: string;
        city?: string;
        zipCode?: string;
        token?: string;
      };

      if (session.user) {
        session.user.id = t.id || '';
        session.user.email = t.email || '';
        session.user.role = normalizeRole(t.role);
        session.user.name = t.name || '';
        session.user.lastName = t.lastName || '';
        session.user.phone = t.phone || '';
        session.user.address = t.address || '';
        session.user.city = t.city || '';
        session.user.zipCode = t.zipCode || '';
        session.user.token = t.token || '';
      }
      return session;
    },
  },

  secret: process.env.JWT_SECRET,
  session: { strategy: 'jwt' },
};

// ─────────────────────────────────────────────────────────────
// HELPERS DE AUTORIZACIÓN (App Router compatible)
// ─────────────────────────────────────────────────────────────

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7).trim() || null;
}

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as DecodedToken;
    if (!decoded?.id || !decoded?.email || !decoded?.role) return null;
    return { id: decoded.id, email: decoded.email, role: normalizeRole(decoded.role) };
  } catch {
    return null;
  }
};

export const verifyRole = async (
  req: Request,
  allowedRoles: UserRole[]
): Promise<DecodedToken | null> => {
  try {
    const token = getBearerToken(req);
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded || !allowedRoles.includes(decoded.role)) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const verifyAdmin = async (req: Request): Promise<DecodedToken | null> =>
  verifyRole(req, ['admin']);

export const verifyAdminToken = (token: string): DecodedToken | null => {
  try {
    const decoded = verifyToken(token);
    return decoded?.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
};

export const verifyProfesional = async (req: Request): Promise<DecodedToken | null> =>
  verifyRole(req, ['profesionales', 'admin']);

export const verifyAdministrativo = async (req: Request): Promise<DecodedToken | null> =>
  verifyRole(req, ['administrativos', 'admin']);

export const verifyPersonal = async (req: Request): Promise<DecodedToken | null> =>
  verifyRole(req, ['admin', 'profesionales', 'administrativos']);

export const verifyPaciente = async (req: Request): Promise<DecodedToken | null> =>
  verifyRole(req, ['pacientes', 'admin']);