/* eslint-disable */

import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from './mongoose';
import UserModel from '../models/User';
import { NextRequest } from 'next/server';
import LogModel from '../models/LogLogin';
import nodemailer from 'nodemailer';

/**
 * Roles disponibles en el sistema
 */
export type UserRole =
  | 'admin'
  | 'profesionales'
  | 'administrativos'
  | 'pacientes';

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
 *
 * IMPORTANTE:
 * Los usuarios nuevos siempre serán pacientes.
 *
 * Si existe algún usuario viejo con role "user",
 * lo tratamos como paciente para mantener compatibilidad
 * con datos anteriores.
 */
function normalizeRole(role?: string): UserRole {
  switch (role) {
    case 'admin':
      return 'admin';

    case 'profesionales':
      return 'profesionales';

    case 'administrativos':
      return 'administrativos';

    case 'pacientes':
      return 'pacientes';

    // Compatibilidad con usuarios antiguos
    case 'user':
      return 'pacientes';

    default:
      return 'pacientes';
  }
}

/**
 * Envía un email avisando que hubo un inicio de sesión.
 *
 * Si el mailer no está configurado, no rompe el login.
 */
async function sendLoginEmail(to: string): Promise<void> {
  try {
    if (
      !process.env.MAILER_EMAIL ||
      !process.env.MAILER_SECRET_KEY
    ) {
      console.warn(
        '⚠️ MAILER_EMAIL o MAILER_SECRET_KEY no están configurados. Se omite email de login.'
      );

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

        <p>
          <strong>Email:</strong> ${to}
        </p>

        <p>
          <strong>Fecha:</strong>
          ${new Date().toLocaleString('es-AR')}
        </p>

        <br />

        <p>
          Si no fuiste vos, verificá tu cuenta y cambiá tu contraseña.
        </p>
      `,
    });
  } catch (error) {
    /**
     * Nunca hacemos fallar el login porque el email no pudo enviarse.
     */
    console.error('❌ Error enviando email de login:', error);
  }
}

/**
 * Genera nuestro JWT interno.
 *
 * El JWT debe contener solamente información necesaria
 * para identificar al usuario y conocer su rol.
 */
function generateJwt(user: {
  id: string;
  email: string;
  role: UserRole;
}): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: '30d',
    }
  );
}

/**
 * Configuración de NextAuth
 */
export const authOptions: NextAuthOptions = {
  providers: [
    /**
     * GOOGLE
     */
    GoogleProvider({
      clientId: process.env.ID_GOOGLE as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),

    /**
     * EMAIL + PASSWORD
     */
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },

        password: {
          label: 'Contraseña',
          type: 'password',
        },
      },

      async authorize(credentials): Promise<ExtendedUser | null> {
        await connectDB();

        /**
         * Validación básica
         */
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son obligatorios');
        }

        const email = credentials.email.trim().toLowerCase();

        /**
         * Buscar usuario
         */
        const user = await UserModel.findOne({
          email,
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        /**
         * Verificar contraseña
         */
        if (!user.password) {
          throw new Error(
            'Esta cuenta no tiene una contraseña configurada.'
          );
        }

        const passwordCorrecta = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordCorrecta) {
          throw new Error('Contraseña incorrecta');
        }

        /**
         * Normalizar rol.
         *
         * Si el usuario viejo tiene "user",
         * dentro de la sesión será tratado como paciente.
         */
        const role = normalizeRole(user.role);

        /**
         * Generar JWT
         */
        const token = generateJwt({
          id: user._id.toString(),
          email: user.email,
          role,
        });

        /**
         * Devolver usuario a NextAuth
         */
        return {
          id: user._id.toString(),

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
    /**
     * ============================================================
     * SIGN IN
     * ============================================================
     */
    async signIn({ user, account }) {
      await connectDB();

      /**
       * ----------------------------------------------------------
       * GOOGLE
       * ----------------------------------------------------------
       */
      if (account?.provider === 'google') {
        if (!user.email) {
          console.error('❌ Google no devolvió email.');

          return false;
        }

        const email = user.email.trim().toLowerCase();

        /**
         * Buscar usuario existente.
         */
        let existingUser = await UserModel.findOne({
          email,
        });

        /**
         * --------------------------------------------------------
         * USUARIO NUEVO
         * --------------------------------------------------------
         *
         * Todo usuario público nuevo entra como PACIENTE.
         *
         * NO se permite elegir el rol desde el login.
         */
        if (!existingUser) {
          existingUser = new UserModel({
            name: user.name || '',

            lastName: '',

            phone: '',

            address: '',

            city: '',

            zipCode: '',

            email,

            img: user.image || '',

            /**
             * Google no necesita una contraseña real.
             */
            password: await bcrypt.hash(
              `google-auth-${email}`,
              10
            ),

            /**
             * IMPORTANTE:
             * Todo usuario nuevo = paciente.
             */
            role: 'pacientes',

            google: true,
          });

          await existingUser.save();

          console.log(
            `✅ Nuevo paciente registrado con Google: ${email}`
          );
        }

        /**
         * --------------------------------------------------------
         * USUARIO EXISTENTE
         * --------------------------------------------------------
         *
         * Nunca modificamos el rol existente.
         *
         * Ejemplo:
         *
         * MongoDB:
         * role: "profesionales"
         *
         * Login Google:
         * sigue siendo "profesionales".
         */
        const role = normalizeRole(existingUser.role);

        /**
         * Si el usuario tenía un role viejo "user",
         * lo actualizamos a "pacientes".
         */
        if (existingUser.role !== role) {
          existingUser.role = role;

          await existingUser.save();
        }

        /**
         * Generar JWT interno.
         */
        const token = generateJwt({
          id: existingUser._id.toString(),
          email: existingUser.email,
          role,
        });

        /**
         * Mapear usuario para NextAuth.
         */
        const u = user as ExtendedUser;

        u.id = existingUser._id.toString();

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

      /**
       * ==========================================================
       * BITÁCORA
       * ==========================================================
       *
       * Registramos solamente los accesos administrativos /
       * profesionales.
       */
      try {
        let role: UserRole | null = null;

        if (user?.role) {
          role = normalizeRole(user.role);
        } else if (user?.email) {
          const existingUser = await UserModel.findOne({
            email: user.email,
          });

          if (existingUser) {
            role = normalizeRole(existingUser.role);
          }
        }

        /**
         * Registramos accesos de usuarios internos.
         *
         * Los pacientes no necesitan generar una entrada
         * de auditoría cada vez que entran.
         */
        if (
          role === 'admin' ||
          role === 'profesionales' ||
          role === 'administrativos'
        ) {
          await LogModel.create({
            email: user.email,

            provider:
              account?.provider || 'credentials',

            timestamp: new Date(),
          });
        }
      } catch (error) {
        /**
         * La bitácora jamás debe impedir el login.
         */
        console.error(
          '⚠️ Error guardando bitácora:',
          error
        );
      }

      /**
       * ==========================================================
       * EMAIL DE LOGIN
       * ==========================================================
       */
      if (user?.email) {
        await sendLoginEmail(user.email);
      }

      return true;
    },

    /**
     * ============================================================
     * JWT NEXTAUTH
     * ============================================================
     */
    async jwt({ token, user }) {
      /**
       * Primera creación del JWT.
       */
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

        /**
         * JWT interno.
         */
        token.token = u.token;
      }

      return token;
    },

    /**
     * ============================================================
     * SESSION NEXTAUTH
     * ============================================================
     */
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

  /**
   * Secret utilizado por NextAuth.
   */
  secret: process.env.JWT_SECRET,

  /**
   * Sesión basada en JWT.
   */
  session: {
    strategy: 'jwt',
  },
};

/**
 * ================================================================
 * HELPERS DE AUTORIZACIÓN
 * ================================================================
 */

/**
 * Obtiene el Bearer Token del header Authorization.
 */
function getBearerToken(
  req: NextRequest
): string | null {
  const authHeader = req.headers.get('authorization');

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return null;
  }

  return authHeader.substring(7).trim() || null;
}

/**
 * Verifica un JWT.
 */
export const verifyToken = (
  token: string
): DecodedToken | null => {
  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    ) as DecodedToken;

    if (
      !decoded?.id ||
      !decoded?.email ||
      !decoded?.role
    ) {
      return null;
    }

    return {
      id: decoded.id,

      email: decoded.email,

      role: normalizeRole(decoded.role),
    };
  } catch {
    return null;
  }
};

/**
 * ================================================================
 * VERIFY ROLE
 * ================================================================
 *
 * Permite proteger una API según uno o varios roles.
 *
 * Ejemplo:
 *
 * const user = await verifyRole(req, [
 *   'admin',
 *   'administrativos'
 * ]);
 *
 */
export const verifyRole = async (
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<DecodedToken | null> => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return null;
    }

    if (!allowedRoles.includes(decoded.role)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

/**
 * ================================================================
 * VERIFY ADMIN
 * ================================================================
 *
 * Solamente ADMIN.
 */
export const verifyAdmin = async (
  req: NextRequest
): Promise<DecodedToken | null> => {
  return verifyRole(req, ['admin']);
};

/**
 * ================================================================
 * VERIFY ADMIN TOKEN
 * ================================================================
 *
 * Verifica directamente un JWT y permite únicamente ADMIN.
 */
export const verifyAdminToken = (
  token: string
): DecodedToken | null => {
  try {
    const decoded = verifyToken(token);

    if (!decoded) {
      return null;
    }

    return decoded.role === 'admin'
      ? decoded
      : null;
  } catch {
    return null;
  }
};

/**
 * ================================================================
 * VERIFY PROFESIONAL
 * ================================================================
 */
export const verifyProfesional = async (
  req: NextRequest
): Promise<DecodedToken | null> => {
  return verifyRole(req, [
    'profesionales',
    'admin',
  ]);
};

/**
 * ================================================================
 * VERIFY ADMINISTRATIVO
 * ================================================================
 */
export const verifyAdministrativo = async (
  req: NextRequest
): Promise<DecodedToken | null> => {
  return verifyRole(req, [
    'administrativos',
    'admin',
  ]);
};

/**
 * ================================================================
 * VERIFY PERSONAL INTERNO
 * ================================================================
 *
 * Admin + profesionales + administrativos.
 */
export const verifyPersonal = async (
  req: NextRequest
): Promise<DecodedToken | null> => {
  return verifyRole(req, [
    'admin',
    'profesionales',
    'administrativos',
  ]);
};

/**
 * ================================================================
 * VERIFY PACIENTE
 * ================================================================
 *
 * Paciente + admin.
 *
 * Esto sirve, por ejemplo, para APIs donde el paciente puede
 * consultar/modificar sus propios turnos.
 *
 * IMPORTANTE:
 * La API debe además comprobar que el recurso pertenece al
 * paciente identificado por decoded.id.
 */
export const verifyPaciente = async (
  req: NextRequest
): Promise<DecodedToken | null> => {
  return verifyRole(req, [
    'pacientes',
    'admin',
  ]);
};