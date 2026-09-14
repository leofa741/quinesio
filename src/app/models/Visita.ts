// app/models/Visita.ts
import mongoose from 'mongoose';

const VisitaSchema = new mongoose.Schema({
  propiedadId: {
    type: String,
    required: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    index: true
  },
  visitorId: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  // Índice compuesto para evitar visitas duplicadas del mismo visitor a la misma propiedad
  indexes: [
    { unique: true, fields: ['propiedadId', 'visitorId'] }
  ]
});

export default mongoose.models.Visita || mongoose.model('Visita', VisitaSchema);