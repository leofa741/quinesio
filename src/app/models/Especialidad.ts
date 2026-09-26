import mongoose, { Schema, Document } from 'mongoose';

export interface IEspecialidad extends Document {
  name: string;
  slug: string;
  description: string;
  count: number;
  image?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EspecialidadSchema = new Schema<IEspecialidad>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    count: { type: Number, default: 0 },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Evita el error de sobreescritura de modelo en el hot-reload de Next.js
export default mongoose.models.Especialidad || mongoose.model<IEspecialidad>('Especialidad', EspecialidadSchema);