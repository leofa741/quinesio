// app/models/Alerta.ts
import { Schema, model, models } from 'mongoose';

const AlertaSchema = new Schema({
  // 👤 Usuario/Cliente que crea la alerta
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    index: true
  },

  // 🎯 Tipo de alerta
  tipo: {
    type: String,
    enum: ['propiedad', 'busqueda'],
    required: true
  },

  // 🏠 Si es alerta de propiedad específica
  propiedad: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    index: true
  },

  // 🔍 Si es alerta de búsqueda guardada
  criterios: {
    tipoOperacion: { type: String, enum: ['venta', 'alquiler', 'ambos'] },
    tipoPropiedad: [String], // ['departamento', 'casa', ...]
    categoria: { type: String, enum: ['residencial', 'comercial', 'industrial', 'inversion'] },
    ubicacion: {
      barrio: [String],
      ciudad: String,
      provincia: String,
      precioMin: Number,
      precioMax: Number,
      metrosMin: Number,
      metrosMax: Number
    }
  },

  // ⚙️ Configuración
  activo: { type: Boolean, default: true },
  frecuencia: {
    type: String,
    enum: ['inmediato', 'diario', 'semanal'],
    default: 'diario'
  },

  // 📊 Tracking
  ultimoEnvio: Date,
  totalEnvios: { type: Number, default: 0 },
  ultimoClick: Date,

  // 🗑️ Soft delete
  eliminado: { type: Boolean, default: false, index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔍 Índices para búsquedas eficientes
AlertaSchema.index(
  { usuario: 1, activo: 1 },
  { partialFilterExpression: { eliminado: false } }
);
AlertaSchema.index({ tipo: 1, activo: 1 });
AlertaSchema.index({ 'criterios.ubicacion.barrio': 1, activo: 1 });
AlertaSchema.index({ frecuencia: 1, activo: 1, ultimoEnvio: 1 });

// 🧹 Middleware para limpiar datos antes de guardar
AlertaSchema.pre('save', function (next) {
  // Normalizar arrays de criterios
  if (this.criterios?.tipoPropiedad) {
    this.criterios.tipoPropiedad = this.criterios.tipoPropiedad
      .map((t: string) => t.toLowerCase().trim())
      .filter(Boolean);
  }
  if (this.criterios?.ubicacion?.barrio) {
    this.criterios.ubicacion.barrio = this.criterios.ubicacion.barrio
      .map((b: string) => b.toLowerCase().trim())
      .filter(Boolean);
  }
  next();
});

const Alerta = models.Alerta || model('Alerta', AlertaSchema);
export default Alerta;