// app/models/Product.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  nombre: string;
  descripcion: string;
  categoria: 'vestidos' | 'remeras' | 'pantalones' | 'accesorios' | 'outwear';
  precio: number;
  moneda: 'ARS' | 'USD';
  imagenes: string[];
  slug: string;
  destacado: boolean;
  nuevo: boolean;
  caracteristicas: {
    talle: string;
    color: string;
    material: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    categoria: { 
      type: String, 
      required: true, 
      enum: ['vestidos', 'remeras', 'pantalones', 'accesorios', 'outwear'] 
    },
    precio: { type: Number, required: true, min: 0 },
    moneda: { type: String, required: true, enum: ['ARS', 'USD'] },
    imagenes: { 
      type: [String], 
      required: true,
      validate: [(val: string[]) => val.length >= 1 && val.length <= 5, 'Debe tener entre 1 y 5 imágenes']
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    destacado: { type: Boolean, default: false },
    nuevo: { type: Boolean, default: true },
    caracteristicas: {
      talle: { type: String, default: '' },
      color: { type: String, default: '' },
      material: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

// Índice único para el slug
ProductSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);