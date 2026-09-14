// app/api/gestion/public/categorias/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import Property from '@/app/models/Property';

connectDB();

export async function GET() {
  try {
    // Obtener categorías únicas con counts de propiedades publicadas
    const categorias = await Property.aggregate([
      { $match: { estado: 'publicado', activo: true } },
      {
        $group: {
          _id: '$categoria',
          count: { $sum: 1 },
          tiposPropiedad: { $addToSet: '$tipoPropiedad' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Obtener tipos de propiedad con counts
    const tiposPropiedad = await Property.aggregate([
      { $match: { estado: 'publicado', activo: true } },
      {
        $group: {
          _id: '$tipoPropiedad',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Obtener barrios populares con counts
    const barrios = await Property.aggregate([
      { $match: { estado: 'publicado', activo: true, 'direccion.barrio': { $exists: true } } },
      {
        $group: {
          _id: '$direccion.barrio',
          count: { $sum: 1 },
          ciudad: { $first: '$direccion.ciudad' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    return NextResponse.json({
      categorias: categorias.map(c => ({
        slug: c._id,
        name: c._id.charAt(0).toUpperCase() + c._id.slice(1),
        count: c.count,
        tipos: c.tiposPropiedad
      })),
      tiposPropiedad: tiposPropiedad.map(t => ({
        slug: t._id,
        name: t._id.charAt(0).toUpperCase() + t._id.slice(1),
        count: t.count
      })),
      barrios: barrios.map(b => ({
        slug: b._id.toLowerCase().replace(/\s+/g, '-'),
        name: b._id,
        count: b.count,
        ciudad: b.ciudad
      })),
      // Counts rápidos para el home
      totals: {
        venta: categorias.reduce((acc, c) => acc + c.count, 0), // Simplificado
        alquiler: categorias.reduce((acc, c) => acc + c.count, 0),
        total: categorias.reduce((acc, c) => acc + c.count, 0),
      }
    });
    
  } catch (error) {
    console.error('Error cargando categorías públicas:', error);
    return NextResponse.json({ 
      categorias: [], 
      tiposPropiedad: [], 
      barrios: [],
      totals: { venta: 0, alquiler: 0, total: 0 }
    }, { status: 500 });
  }
}