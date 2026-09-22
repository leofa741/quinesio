import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescripcion extends Document {
  paciente: mongoose.Types.ObjectId;
  profesional: mongoose.Types.ObjectId;
  
  // Datos clínicos
  diagnostico: string;
  prescripcion: string; // El tratamiento prescrito
  indicaciones: string;
  contraindicaciones: string;
  
  // Validez
  fechaEmision: Date;
  fechaVencimiento: Date;
  
  // Estado
  estado: 'activa' | 'vencida' | 'anulada';
  
  // Trazabilidad
  codigoVerificacion: string; // Código único para el QR
  ipEmision: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PrescripcionSchema = new Schema<IPrescripcion>({
  paciente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  profesional: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  diagnostico: { type: String, required: true, trim: true },
  prescripcion: { type: String, required: true, trim: true },
  indicaciones: { type: String, trim: true },
  contraindicaciones: { type: String, trim: true },
  
  fechaEmision: { type: Date, default: Date.now },
  fechaVencimiento: { type: Date, required: true },
  
  estado: { 
    type: String, 
    enum: ['activa', 'vencida', 'anulada'], 
    default: 'activa' 
  },
  
  codigoVerificacion: { type: String, unique: true, required: true },
  ipEmision: { type: String, trim: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice para búsqueda rápida por código de verificación (QR)
PrescripcionSchema.index({ codigoVerificacion: 1 });
PrescripcionSchema.index({ paciente: 1, fechaEmision: -1 });
PrescripcionSchema.index({ estado: 1 });

export default mongoose.models.Prescripcion || mongoose.model<IPrescripcion>('Prescripcion', PrescripcionSchema);