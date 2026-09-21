import mongoose, { Schema, Document } from 'mongoose';

interface EjercicioAsignado {
  ejercicioId: mongoose.Types.ObjectId;
  series: string; // Ej: "3"
  repeticiones: string; // Ej: "15" o "hasta el fallo"
  frecuencia: string; // Ej: "Diario", "3 veces por semana"
  notasEspecificas: string; // Ej: "Mantener 5 segundos, sin dolor"
}

export interface IPlanEjercicios extends Document {
  paciente: mongoose.Types.ObjectId;
  profesional: mongoose.Types.ObjectId;
  fechaInicio: Date;
  fechaFin?: Date;
  notasGenerales: string; // Ej: "Aplicar calor antes de empezar"
  ejercicios: EjercicioAsignado[];
  activo: boolean;
}

const PlanEjerciciosSchema = new Schema<IPlanEjercicios>({
  paciente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  profesional: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date },
  notasGenerales: { type: String, trim: true },
  ejercicios: [{
    ejercicioId: { type: Schema.Types.ObjectId, ref: 'Ejercicio', required: true },
    series: { type: String, required: true },
    repeticiones: { type: String, required: true },
    frecuencia: { type: String, required: true },
    notasEspecificas: { type: String, trim: true }
  }],
  activo: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.PlanEjercicios || mongoose.model<IPlanEjercicios>('PlanEjercicios', PlanEjerciciosSchema);