// app/models/Property.ts
import { Schema, model, models, Document } from 'mongoose';

// ─────────────────────────────────────────────────────────────
// 🔹 Sub-esquemas para propiedades
// ─────────────────────────────────────────────────────────────

// 📸 Imágenes de la propiedad (hasta ~22 por propiedad)
const imagenSchema = new Schema({
  url: { type: String, required: true },
  descripcion: { type: String, trim: true },
  principal: { type: Boolean, default: false }, // Imagen de portada
  orden: { type: Number, default: 0 }, // Para ordenar en el carrusel
  tipo: { 
    type: String, 
    enum: ['foto', 'plano', 'video_thumbnail'], 
    default: 'foto' 
  },
}, { _id: false });

// 📍 Dirección estructurada
const direccionSchema = new Schema({
  calle: { type: String, required: true, trim: true },
  numero: { type: String, required: true, trim: true },
  piso: { type: String, trim: true }, // Ej: "3", "PH", ""
  depto: { type: String, trim: true }, // Ej: "A", "12", ""
  barrio: { type: String, required: true, trim: true },
  ciudad: { type: String, required: true, trim: true },
  provincia: { type: String, required: true, trim: true },
  codigoPostal: { type: String, trim: true },
  coordenadas: {
    lat: { type: Number },
    lng: { type: Number },
  },
  mostrarDireccionExacta: { type: Boolean, default: false }, // Para privacidad en publicaciones
}, { _id: false });

// 🏠 Características físicas de la propiedad
const caracteristicasSchema = new Schema({
  // Espacios
  ambientes: { type: Number, min: 1 },
  dormitorios: { type: Number, min: 0 },
  banios: { type: Number, min: 0 },
  toilets: { type: Number, min: 0 },
  cochera: { type: Boolean, default: false },
  cocheras: { type: Number, min: 0 },
  
  // Superficies
  metrosCubiertos: { type: Number, min: 0 },
  metrosTotales: { type: Number, min: 0 },
  metrosTerreno: { type: Number, min: 0 }, // Para casas/terrenos
  
  // Ubicación dentro del edificio
  piso: { type: Number, min: -1 }, // -1 para subsuelo, 0 para PB
  orientacion: { 
    type: String, 
    enum: ['norte', 'sur', 'este', 'oeste', 'noreste', 'noroeste', 'sureste', 'suroeste'] 
  },
  
  // Estado de la propiedad
  antiguedad: { type: Number, min: 0 }, // Años
  estadoConservacion: {
    type: String,
    enum: ['nuevo', 'excelente', 'bueno', 'regular', 'a renovar'],
    default: 'bueno'
  },
  
  // Extras
  balcon: { type: Boolean, default: false },
  terraza: { type: Boolean, default: false },
  patio: { type: Boolean, default: false },
  pileta: { type: Boolean, default: false },
  jardin: { type: Boolean, default: false },
  ascensor: { type: Boolean, default: false },
  seguridad: { type: Boolean, default: false },
}, { _id: false });

// 💰 Información financiera
const preciosSchema = new Schema({
  venta: {
    moneda: { type: String, enum: ['ARS', 'USD'], default: 'USD' },
    monto: { type: Number, min: 0 },
    comision: { type: Number, min: 0, default: 3 }, // % para la inmobiliaria
    gastosEscrituracion: { type: Boolean, default: true },
  },
  alquiler: {
    moneda: { type: String, enum: ['ARS', 'USD'], default: 'USD' },
    monto: { type: Number, min: 0 },
    comision: { type: Number, min: 0, default: 4.5 }, // % para la inmobiliaria
    ajuste: { type: String, enum: ['anual', 'semestral', 'trimestral'], default: 'anual' },
    garantiaRequerida: { type: String, enum: ['propiedad', 'fiador', 'caucion', 'seguro'], default: 'propiedad' },
  },
  expensas: { type: Number, min: 0 }, // Mensuales, para departamentos
  impuestos: { type: Number, min: 0 }, // ABL, ingresos brutos, etc.
}, { _id: false });

// ─────────────────────────────────────────────────────────────
// 🔹 Schema principal de Property
// ─────────────────────────────────────────────────────────────

const propertySchema = new Schema({
  // 📋 Identificación básica
  titulo: { type: String, required: true, trim: true, maxlength: 100 }, // Ej: "Departamento 3 ambientes en Palermo"
  descripcion: { type: String, required: true, trim: true, maxlength: 4000 },
  codigoInterno: { type: String, unique: true, sparse: true, trim: true }, // Para referencia interna
  
  // 🏷️ Clasificación
  tipoPropiedad: { 
    type: String, 
    required: true,
    enum: ['departamento', 'casa', 'local', 'oficina', 'terreno', 'galpon', 'ph','campo', 'barrio cerrado', 'urbanizacion protegida', 'cochera'],
  },
  tipoOperacion: { 
    type: String, 
    required: true,
    enum: ['venta', 'alquiler', 'ambos'],
  },
  categoria: { 
    type: String, 
    trim: true,
    enum: ['residencial', 'comercial', 'industrial', 'inversion'],
    default: 'residencial'
  },
  
  // 📍 Ubicación
  direccion: { type: direccionSchema, required: true },
  zona: { type: String, trim: true }, // Ej: "Palermo Soho", "Microcentro"
  
  // 🏠 Características
  caracteristicas: { type: caracteristicasSchema, default: {} },
  
  // 💰 Precios y condiciones
  precios: { type: preciosSchema, required: true },
  
  // 📸 Multimedia (hasta ~10 imágenes + extras)
  imagenes: [imagenSchema],
  videoUrl: { type: String }, // YouTube/Vimeo
  tourVirtualUrl: { type: String }, // Matterport, etc.
  planoUrl: { type: String },
  
  // 📊 Estado y disponibilidad
  estado: {
    type: String,
    enum: ['borrador', 'publicado', 'reservado', 'alquilado', 'vendido', 'baja'],
    default: 'borrador'
  },
  fechaPublicacion: { type: Date },
  fechaDisponibilidad: { type: Date },
  destacado: { type: Boolean, default: false }, // Para aparecer en home/destacados
  urgente: { type: Boolean, default: false }, // Badge de "oportunidad"
  
  // 👥 Relaciones
  propietario: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
  agente: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Agente responsable
  
  // 📝 Gestión interna
  notasInternas: { type: String, trim: true }, // Solo visible para admin/agente
  visitasProgramadas: [{ 
    fecha: Date, 
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    estado: { type: String, enum: ['pendiente', 'confirmada', 'realizada', 'cancelada'] }
  }],
  
  // ✅ Metadata
  activo: { type: Boolean, default: true }, // Soft delete
  seo: {
    slug: { type: String, unique: true, trim: true }, // Para URLs amigables
    metaTitle: { type: String, maxlength: 60 },
    metaDescription: { type: String, maxlength: 160 },
  },
}, {
  timestamps: true, // createdAt, updatedAt automáticos
});

// ─────────────────────────────────────────────────────────────
// 🔹 Índices para optimizar consultas
// ─────────────────────────────────────────────────────────────

// Búsqueda por texto (título, descripción, barrio)
propertySchema.index({ 
  titulo: 'text', 
  descripcion: 'text', 
  'direccion.barrio': 'text',
  'direccion.ciudad': 'text'
}, { 
  name: 'search_index',
  weights: {
    titulo: 10,
    descripcion: 5,
    'direccion.barrio': 3,
    'direccion.ciudad': 2
  }
});

// Filtros comunes de búsqueda
propertySchema.index({ tipoPropiedad: 1, tipoOperacion: 1, estado: 1 });
propertySchema.index({ 'direccion.barrio': 1, 'precios.venta.monto': 1 });
propertySchema.index({ destacado: 1, fechaPublicacion: -1 });
propertySchema.index({ agente: 1, estado: 1 }); // Para dashboard de agentes

// Unique para slug SEO (solo si existe)
propertySchema.index({ 'seo.slug': 1 }, { unique: true, sparse: true });

// ─────────────────────────────────────────────────────────────
// 🔹 Virtuals (campos calculados)
// ─────────────────────────────────────────────────────────────

// URL amigable para la propiedad
propertySchema.virtual('url').get(function(this: Document & { seo?: { slug?: string }, _id: string }) {
  const slug = this.seo?.slug || this._id;
  return `/propiedad/${slug}`;
});

// Precio principal según operación
propertySchema.virtual('precioPrincipal').get(function(this: Document & { tipoOperacion?: string; precios?: any }) {
  if (this.tipoOperacion === 'venta') return this.precios?.venta;
  if (this.tipoOperacion === 'alquiler') return this.precios?.alquiler;
  return { venta: this.precios?.venta, alquiler: this.precios?.alquiler };
});

// Imagen principal para listados
propertySchema.virtual('imagenPrincipal').get(function(this: Document & { imagenes?: any[] }) {
  return this.imagenes?.find(img => img.principal) || this.imagenes?.[0];
});

// ─────────────────────────────────────────────────────────────
// 🔹 Métodos útiles
// ─────────────────────────────────────────────────────────────

propertySchema.methods.marcarComoVendido = async function() {
  this.estado = 'vendido';
  this.fechaDisponibilidad = new Date();
  return this.save();
};

propertySchema.methods.agregarImagen = function(url: string, descripcion?: string, principal = false) {
  if (principal) {
    // Si es principal, desmarcar las demás
    this.imagenes.forEach((img: any) => { img.principal = false; });
  }
  this.imagenes.push({
    url,
    descripcion,
    principal,
    orden: this.imagenes.length,
    tipo: 'foto'
  });
  return this.save();
};

// ─────────────────────────────────────────────────────────────
// 🔹 Exportación del modelo
// ─────────────────────────────────────────────────────────────

const Property = models.Property || model('Property', propertySchema);
export default Property;

// 🔹 Tipo TypeScript para uso en frontend
export interface IProperty extends Document {
  titulo: string;
  descripcion: string;
  codigoInterno?: string;
  tipoPropiedad: 'departamento' | 'casa' | 'local' | 'oficina' | 'terreno' | 'galpon' | 'ph'|'campo' | 'barrio cerrado' | 'urbanizacion protegida' | 'cochera';
  tipoOperacion: 'venta' | 'alquiler' | 'ambos';
  categoria: 'residencial' | 'comercial' | 'industrial' | 'inversion';
  direccion: {
    calle: string;
    numero: string;
    piso?: string;
    depto?: string;
    barrio: string;
    ciudad: string;
    provincia: string;
    codigoPostal?: string;
    coordenadas?: { lat: number; lng: number };
    mostrarDireccionExacta?: boolean;
  };
  zona?: string;
  caracteristicas: {
    ambientes?: number;
    dormitorios?: number;
    banios?: number;
    toilets?: number;
    cochera?: boolean;
    cocheras?: number;
    metrosCubiertos?: number;
    metrosTotales?: number;
    metrosTerreno?: number;
    piso?: number;
    orientacion?: 'norte' | 'sur' | 'este' | 'oeste' | 'noreste' | 'noroeste' | 'sureste' | 'suroeste';
    antiguedad?: number;
    estadoConservacion?: 'nuevo' | 'excelente' | 'bueno' | 'regular' | 'a renovar';
    balcon?: boolean;
    terraza?: boolean;
    patio?: boolean;
    pileta?: boolean;
    jardin?: boolean;
    ascensor?: boolean;
    seguridad?: boolean;
  };
  precios: {
    venta?: {
      moneda: 'ARS' | 'USD';
      monto?: number;
      comision?: number;
      gastosEscrituracion?: boolean;
    };
    alquiler?: {
      moneda: 'ARS' | 'USD';
      monto?: number;
      comision?: number;
      ajuste?: 'anual' | 'semestral' | 'trimestral';
      garantiaRequerida?: 'propiedad' | 'fiador' | 'caucion' | 'seguro';
    };
    expensas?: number;
    impuestos?: number;
  };
  imagenes: Array<{
    url: string;
    descripcion?: string;
    principal?: boolean;
    orden?: number;
    tipo?: 'foto' | 'plano' | 'video_thumbnail';
  }>;
  videoUrl?: string;
  tourVirtualUrl?: string;
  planoUrl?: string;
  estado: 'borrador' | 'publicado' | 'reservado' | 'alquilado' | 'vendido' | 'baja';
  fechaPublicacion?: Date;
  fechaDisponibilidad?: Date;
  destacado: boolean;
  urgente: boolean;
  propietario: Schema.Types.ObjectId;
  agente: Schema.Types.ObjectId;
  notasInternas?: string;
  visitasProgramadas?: Array<{
    fecha: Date;
    cliente: Schema.Types.ObjectId;
    estado: 'pendiente' | 'confirmada' | 'realizada' | 'cancelada';
  }>;
  activo: boolean;
  seo?: {
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  // Virtuales
  url?: string;
  precioPrincipal?: any;
  imagenPrincipal?: any;
  // Métodos
  marcarComoVendido: () => Promise<any>;
  agregarImagen: (url: string, descripcion?: string, principal?: boolean) => Promise<any>;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Agregar esto al final de app/models/Property.ts para reutilizar tipos en frontend

// 🔹 Export para uso en componentes del frontend
export type { IProperty as PropertyType };
