import mongoose, { Schema, Document } from 'mongoose';

export interface INotaSesion extends Document {
  planTratamiento: mongoose.Types.ObjectId; // Vincula la nota al plan
  paciente: mongoose.Types.ObjectId;
  profesional: mongoose.Types.ObjectId;
  turnoId?: mongoose.Types.ObjectId;        // Opcional: vincula la nota al turno específico del calendario
  numeroSesion: number;                     // Ej: 1, 2, 3...
  fecha: Date;
  dolorEva: number;                         // Escala del 1 al 10
  tecnicasAplicadas: string;                // Ej: "Electroterapia 10min, Ejercicios de propiocepción"
  evolucion: string;                        // Notas clínicas del profesional
  proximosPasos: string;                    // Tareas para el paciente o próxima sesión
  createdAt: Date;
}

const NotaSesionSchema = new Schema<INotaSesion>({
  planTratamiento: { type: Schema.Types.ObjectId, ref: 'PlanTratamiento', required: true },
  paciente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  profesional: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  turnoId: { type: Schema.Types.ObjectId, ref: 'Turno' },
  numeroSesion: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  dolorEva: { type: Number, min: 0, max: 10 },
  tecnicasAplicadas: { type: String, required: true },
  evolucion: { type: String, required: true },
  proximosPasos: { type: String }
}, { timestamps: true });

export default mongoose.models.NotaSesion || mongoose.model<INotaSesion>('NotaSesion', NotaSesionSchema);