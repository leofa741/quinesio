// models/Paciente.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaciente extends Document {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: Date;
  email?: string;
  telefono?: string;
  direccion?: {
    calle: string;
    numero: string;
    ciudad: string;
    provincia: string;
    codigoPostal?: string;
  };
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
  fechaAlta: Date;
  fechaBaja?: Date;
  activo: boolean;
  creadoPor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PacienteSchema = new Schema<IPaciente>({
  nombre: { type: String, required: true, trim: true, index: true },
  apellido: { type: String, required: true, trim: true, index: true },
  dni: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    match: [/^\d{7,8}$/, 'DNI inválido'] 
  },
  fechaNacimiento: { type: Date, required: true },
  email: { type: String, lowercase: true, trim: true },
  telefono: { type: String, trim: true },
  
  direccion: {
    calle: String,
    numero: String,
    ciudad: String,
    provincia: String,
    codigoPostal: String
  },
  
  obraSocial: {
    nombre: { type: String, trim: true },
    codigo: String,
    plan: String,
    numeroAfiliado: String,
    activo: { type: Boolean, default: true }
  },
  
  diagnosticoPrincipal: { type: String, trim: true },
  sesionesAutorizadas: { type: Number, min: 0 },
  sesionesRealizadas: { type: Number, default: 0, min: 0 },
  
  fechaAlta: { type: Date, default: Date.now },
  fechaBaja: Date,
  activo: { type: Boolean, default: true },
  
  creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔹 Virtual: Edad calculada
PacienteSchema.virtual('edad').get(function(this: IPaciente) {
  if (!this.fechaNacimiento) return null;
  const diff = Date.now() - new Date(this.fechaNacimiento).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

// 🔹 Virtual: Sesiones restantes
PacienteSchema.virtual('sesionesRestantes').get(function(this: IPaciente) {
  if (!this.sesionesAutorizadas) return null;
  return this.sesionesAutorizadas - (this.sesionesRealizadas || 0);
});

// 🔹 Index para búsquedas
PacienteSchema.index({ nombre: 'text', apellido: 'text', dni: 'text' });

// 🔹 Middleware: Normalizar DNI
PacienteSchema.pre('save', function(next) {
  if (this.isModified('dni')) {
    this.dni = this.dni.replace(/\./g, '').replace(/-/g, '');
  }
  next();
});

// ✅ CORRECCIÓN: Patrón correcto con tipo explícito
const PacienteModel: Model<IPaciente> = 
  mongoose.models.Paciente || mongoose.model<IPaciente>('Paciente', PacienteSchema);

export default PacienteModel;