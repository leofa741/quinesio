import mongoose, { Schema, Document } from 'mongoose';

export interface IActividad extends Document {
  turnoId?: string; // 🔗 NUEVO: Vinculo con el turno original
  profesionalId: string;
  profesionalNombre: string;
  pacienteNombre: string;
  fecha: Date;
  duracionMinutos: number;
  tipoSesion: string;
  estado: string;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActividadSchema = new Schema<IActividad>(
  {
    turnoId: { type: String, default: null }, // 🔗 Agregado
    profesionalId: { type: String, required: true },
    profesionalNombre: { type: String, required: true },
    pacienteNombre: { type: String, required: true },
    fecha: { type: Date, required: true, default: Date.now },
    duracionMinutos: { type: Number, required: true },
    tipoSesion: { type: String, required: true },
    estado: { type: String, default: 'Completada', enum: ['Completada', 'Cancelada', 'Reprogramada'] },
    notas: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Actividad || mongoose.model<IActividad>('Actividad', ActividadSchema);