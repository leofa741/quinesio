/* eslint-disable */
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ✅ CORREGIDO: Interfaz con tipos precisos y campos de paciente
export interface IUser extends Document {
  // Datos personales
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  img?: string;

  // Auth
  password?: string; // Opcional para usuarios Google
  google?: boolean;  // ✅ CORREGIDO: boolean, no string
  resetPasswordToken?: string;
  resetPasswordExpires?: Date; // ✅ CORREGIDO: Date, no number

  // Rol
  role: 'admin' | 'profesionales' | 'administrativos' | 'pacientes'; // ✅ CORREGIDO: union type
  activo: boolean;

  // 🔹 CAMPOS ESPECÍFICOS DE PACIENTES (agregados)
  obraSocial?: {
    nombre: string;
    codigo?: string;
    plan?: string;
    numeroAfiliado?: string;
    activo: boolean;
  };
  diagnosticoPrincipal?: string;
  sesionesAutorizadas?: number;
  sesionesRealizadas?: number;
  dniUrl?: string;           // ✅ URL del DNI en Cloudinary
  ordenMedicaUrl?: string;   // ✅ URL de orden médica
  fechaNacimiento?: Date;

  //  CAMPOS ESPECÍFICOS DE PROFESIONALES
  matricula?: string;
  especialidades?: string[];
  descripcionProfesional?: string;
  horariosAtencion?: string[];
  tiempoPreparacionMinutos?: number;
  honorarios?: {
    valorSesion?: number;        // Precio de la sesión estándar
    valorEvaluacion?: number;    // Precio de la primera consulta (opcional)
    duracionSesion?: number;     // Duración en minutos (ej: 45, 60)
    moneda?: string;             // 'ARS', 'USD', etc.
  };
  // Metadata
  creadoPor?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Método para comparar contraseña (solo en instancia, no en interfaz de datos)
interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

type UserModelType = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModelType, IUserMethods>({
  name: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true, default: '' },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: { type: String, select: false }, // No devolver por defecto en queries
  google: { type: Boolean, default: false }, // ✅ CORREGIDO: Boolean
  img: String,

  // Contacto
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  zipCode: { type: String, trim: true },

  // Auth recovery
  resetPasswordToken: String,
  resetPasswordExpires: Date, // ✅ CORREGIDO: Date

  // Rol y estado
  role: {
    type: String,
    required: true,
    enum: ['admin', 'profesionales', 'administrativos', 'pacientes'],
    default: 'pacientes' // ✅ CORREGIDO: default a 'pacientes' para nuevos registros
  },
  activo: { type: Boolean, default: true },

  // 🔹 Campos específicos de pacientes
  obraSocial: {
    nombre: String,
    codigo: String,
    plan: String,
    numeroAfiliado: String,
    activo: { type: Boolean, default: true }
  },
  diagnosticoPrincipal: String,
  sesionesAutorizadas: { type: Number, min: 0 },
  sesionesRealizadas: { type: Number, default: 0, min: 0 },
  dniUrl: String,           // ✅ Agregado
  ordenMedicaUrl: String,   // ✅ Agregado
  fechaNacimiento: Date,

  // 🔹 Campos específicos de profesionales 
  matricula: { type: String, trim: true },
  especialidades: [{ type: String, trim: true }],
  descripcionProfesional: { type: String, trim: true },
  horariosAtencion: [{ type: String, trim: true }],
  tiempoPreparacionMinutos: { type: Number, default: 0 },
  honorarios: {
    valorSesion: { type: Number, default: 0 },
    valorEvaluacion: { type: Number, default: 0 },
    duracionSesion: { type: Number, default: 45 },
    moneda: { type: String, default: 'ARS' }
  },

  creadoPor: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔹 Middleware: Hash password antes de guardar
UserSchema.pre('save', async function (next) {
  // Solo hashear si es nuevo o se modificó la password
  if (!this.isModified('password') || !this.password) return next();

  // No hashear si es usuario Google (password dummy)
  if (this.google && this.password?.startsWith('google-auth-')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔹 Método para comparar contraseña
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// 🔹 Virtual: Nombre completo
UserSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.name} ${this.lastName || ''}`.trim();
});

// 🔹 Index para búsquedas rápidas
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, activo: 1 });
UserSchema.index({ name: 'text', lastName: 'text', email: 'text' });

// ✅ CORREGIDO: Exportación con tipo explícito para evitar errores de TypeScript
const UserModel: UserModelType =
  mongoose.models.User || mongoose.model<IUser, UserModelType>('User', UserSchema);

export default UserModel;