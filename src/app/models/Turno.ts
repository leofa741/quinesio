import mongoose, { Schema, Document } from 'mongoose';

// ✅ 1. INTERFAZ DE TYPESCRIPT (Solo define los TIPOS de datos)
export interface ITurno extends Document {
  paciente: mongoose.Types.ObjectId;
  profesional: mongoose.Types.ObjectId;
  
  // Fechas y tiempos
  fechaInicio: Date; 
  fechaFin: Date;    
  duracionMinutos: number;
  
  // Estado del turno
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'ausente' | 'completado' | 'reprogramado';
  
  // Motivos y notas
  motivoConsulta?: string;
  notasInternas?: string;
  ordenMedicaUrl?: string;
  dniFrenteUrl?: string;
  dniDorsoUrl?: string;
  motivoCancelacion?: string;
  
  // Datos financieros del turno (congelados al reservar)
  valorAcordado: number;
  moneda: string;
  requiereAutorizacionObraSocial: boolean;
  numeroAutorizacion?: string;

  // 🔹 CAMPOS FINANCIEROS Y DE PAGO (Tipos puros de TS)
  montoTotal: number;
  montoProfesional: number;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'obra_social';
  estadoPagoPaciente: 'pendiente' | 'pagado' | 'parcial';
  estadoPagoProfesional: 'pendiente' | 'liquidado';
  observacionesPago?: string;
  
  // Metadata
  creadoPor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ 2. SCHEMA DE MOONGOOSE (Define cómo se guarda en la BD)
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

  // 🔹 CAMPOS FINANCIEROS Y DE PAGO (Sintaxis correcta de Mongoose)
  montoTotal: { type: Number, default: 0 },
  montoProfesional: { type: Number, default: 0 },
  metodoPago: { 
    type: String, 
    enum: ['efectivo', 'transferencia', 'tarjeta', 'obra_social'], 
    default: 'efectivo' 
  },
  estadoPagoPaciente: { 
    type: String, 
    enum: ['pendiente', 'pagado', 'parcial'], 
    default: 'pendiente' 
  },
  estadoPagoProfesional: { 
    type: String, 
    enum: ['pendiente', 'liquidado'], 
    default: 'pendiente' 
  },
  observacionesPago: { type: String, trim: true },
  
  creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ 3. ÍNDICES PARA BÚSQUEDAS RÁPIDAS (CRUCIAL para el rendimiento del calendario)
TurnoSchema.index({ profesional: 1, fechaInicio: 1 });
TurnoSchema.index({ paciente: 1, fechaInicio: -1 });
TurnoSchema.index({ estado: 1 });
TurnoSchema.index({ estadoPagoPaciente: 1 }); // Nuevo índice para el módulo de pagos
TurnoSchema.index({ estadoPagoProfesional: 1 }); // Nuevo índice para el módulo de pagos

export default mongoose.models.Turno || mongoose.model<ITurno>('Turno', TurnoSchema);