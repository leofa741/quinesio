import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanTratamiento extends Document {
  paciente: mongoose.Types.ObjectId;
  profesional: mongoose.Types.ObjectId;
  diagnostico: string;
  objetivo: string;
  totalSesiones: number;       // Ej: 10
  sesionesCompletadas: number; // Ej: 3
  fechaInicio: Date;
  estado: 'activo' | 'finalizado' | 'suspendido';
  createdAt: Date;
  updatedAt: Date;
}

const PlanTratamientoSchema = new Schema<IPlanTratamiento>({
  paciente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  profesional: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  diagnostico: { type: String, required: true },
  objetivo: { type: String, required: true },
  totalSesiones: { type: Number, required: true, min: 1 },
  sesionesCompletadas: { type: Number, default: 0 },
  fechaInicio: { type: Date, default: Date.now },
  estado: { type: String, enum: ['activo', 'finalizado', 'suspendido'], default: 'activo' }
}, { timestamps: true });

export default mongoose.models.PlanTratamiento || mongoose.model<IPlanTratamiento>('PlanTratamiento', PlanTratamientoSchema);