import mongoose, { Schema, Document } from 'mongoose';

export interface ITurno extends Document {
  paciente: mongoose.Types.ObjectId;
  profesional: mongoose.Types.ObjectId;
  
  // Fechas y tiempos (Usar Date es vital para evitar problemas de zona horaria)
  fechaInicio: Date; 
  fechaFin: Date;    
  duracionMinutos: number; // Ej: 45, 60 (se copia del profesional al momento de reservar)
  
  // Estado del turno (CRUCIAL para no rediseñar luego)
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'ausente' | 'completado' | 'reprogramado';
  
  // Motivos y notas
  motivoConsulta?: string;
  notasInternas?: string; // Solo visibles para staff
  ordenMedicaUrl?: string;
  dniFrenteUrl?: string;
  dniDorsoUrl?: string;
  motivoCancelacion?: string;
  
  // Datos financieros del turno (se congelan al momento de la reserva)
  valorAcordado: number;
  moneda: string;
  requiereAutorizacionObraSocial: boolean;
  numeroAutorizacion?: string;
  
  // Metadata
  creadoPor: mongoose.Types.ObjectId; // Admin, administrativo o el mismo paciente
  createdAt: Date;
  updatedAt: Date;
}

const TurnoSchema = new Schema<ITurno>({
  paciente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  profesional: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  duracionMinutos: { type: Number, required: true },
  
  estado: { 
    type: String, 
    enum: ['pendiente', 'confirmado', 'cancelado', 'ausente', 'completado', 'reprogramado'],
    default: 'pendiente'
  },
  
  motivoConsulta: { type: String, trim: true },
  notasInternas: { type: String, trim: true },
  motivoCancelacion: { type: String, trim: true },

  ordenMedicaUrl: { type: String, trim: true },
  dniFrenteUrl: { type: String, trim: true },
  dniDorsoUrl: { type: String, trim: true },
  
  valorAcordado: { type: Number, default: 0 },
  moneda: { type: String, default: 'ARS' },
  requiereAutorizacionObraSocial: { type: Boolean, default: false },
  numeroAutorizacion: { type: String, trim: true },
  
  creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Índices para búsquedas rápidas en el calendario
TurnoSchema.index({ profesional: 1, fechaInicio: 1 });
TurnoSchema.index({ paciente: 1, fechaInicio: -1 });
TurnoSchema.index({ estado: 1 });

export default mongoose.models.Turno || mongoose.model<ITurno>('Turno', TurnoSchema);