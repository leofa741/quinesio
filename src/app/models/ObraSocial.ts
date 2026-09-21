import mongoose, { Schema, Document } from 'mongoose';

export interface IObraSocial extends Document {
  nombre: string;
  codigo: string;
  activo: boolean;
  planes: {
    nombre: string;
    codigo: string;
    cobertura: number; // Porcentaje de cobertura (ej: 70, 80, 100)
    requiereAutorizacion: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ObraSocialSchema = new Schema<IObraSocial>({
  nombre: { type: String, required: true, trim: true },
  codigo: { type: String, required: true, unique: true, trim: true },
  activo: { type: Boolean, default: true },
  planes: [{
    nombre: { type: String, required: true },
    codigo: { type: String, required: true },
    cobertura: { type: Number, min: 0, max: 100, default: 70 },
    requiereAutorizacion: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export default mongoose.models.ObraSocial || mongoose.model<IObraSocial>('ObraSocial', ObraSocialSchema);