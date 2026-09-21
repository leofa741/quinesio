import mongoose, { Schema, Document } from 'mongoose';

export interface IEjercicio extends Document {
  nombre: string;
  descripcion: string;
  videoUrl?: string; // Link a YouTube, Vimeo o Cloudinary
  categoria: string; // Ej: "Rodilla", "Columna", "Hombro"
  activo: boolean;
}

const EjercicioSchema = new Schema<IEjercicio>({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  videoUrl: { type: String, trim: true },
  categoria: { type: String, required: true, trim: true },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Ejercicio || mongoose.model<IEjercicio>('Ejercicio', EjercicioSchema);