import mongoose, { Schema, Document } from 'mongoose';

export interface INotificacion extends Document {
  usuario: mongoose.Types.ObjectId;
  tipo: 'turno_libre' | 'nuevo_servicio' | 'recordatorio';
  profesional?: {
    nombre: string;
    especialidad: string;
  };
  tratamiento?: string;
  diasPreferidos?: string[];
  activo: boolean;
  canal: 'email' | 'whatsapp' | 'ambos';
  createdAt: Date;
}

const NotificacionSchema = new Schema<INotificacion>(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tipo: { 
      type: String, 
      enum: ['turno_libre', 'nuevo_servicio', 'recordatorio'], 
      required: true 
    },
    profesional: {
      nombre: String,
      especialidad: String,
    },
    tratamiento: { type: String },
    diasPreferidos: { type: [String], default: [] },
    activo: { type: Boolean, default: true },
    canal: { 
      type: String, 
      enum: ['email', 'whatsapp', 'ambos'], 
      default: 'email' 
    },
  },
  { timestamps: true }
);

// Evitar error de sobreescritura de modelo en Next.js
export default mongoose.models.Notificacion || mongoose.model<INotificacion>('Notificacion', NotificacionSchema);