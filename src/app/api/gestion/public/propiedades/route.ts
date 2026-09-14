// app/api/gestion/public/propiedades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import Property from '@/app/models/Property';

connectDB();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔹 Parámetros de entrada
    const slug = searchParams.get('slug');
    const tipoOperacion = searchParams.get('operacion');
    const tipoPropiedad = searchParams.get('tipo'); // ← 'terreno', 'departamento', etc.
    const categoria = searchParams.get('categoria'); // ← 'residencial', 'comercial', etc.
    const barrio = searchParams.get('barrio');
    const destacado = searchParams.get('destacado') === 'true';
    const search = searchParams.get('search'); // ← Búsqueda por texto libre
    const limit = slug ? 1 : Math.min(parseInt(searchParams.get('limit') || '12'), 50);

    // 🔹 Query base: solo propiedades publicadas y activas
    const baseQuery: any = {
      estado: 'publicado',
      activo: true,
    };

    // 🔹 Aplicar filtros específicos (se mantienen SIEMPRE)
    if (slug) {
      baseQuery['seo.slug'] = slug;
    } else {
      if (tipoOperacion && tipoOperacion !== 'ambos') {
        baseQuery.tipoOperacion = tipoOperacion;
      }
      if (tipoPropiedad) {
        baseQuery.tipoPropiedad = tipoPropiedad; // ← Filtra por 'terreno', 'casa', etc.
      }
      if (categoria) {
        baseQuery.categoria = categoria; // ← Filtra por 'residencial', etc.
      }
      if (barrio) {
        baseQuery['direccion.barrio'] = { $regex: barrio, $options: 'i' };
      }
      if (destacado) {
        baseQuery.destacado = true;
      }
    }

    // 🔹 Counts (solo si no es búsqueda por slug)
    let countsByOperation = { venta: 0, alquiler: 0, ambos: 0 };
    if (!slug) {
      const counts = await Property.aggregate([
        { $match: { estado: 'publicado', activo: true } },
        { $group: { _id: '$tipoOperacion', count: { $sum: 1 } } }
      ]);
      countsByOperation = {
        venta: counts.find(c => c._id === 'venta')?.count || 0,
        alquiler: counts.find(c => c._id === 'alquiler')?.count || 0,
        ambos: counts.find(c => c._id === 'ambos')?.count || 0,
      };
    }

    // 🔹 Función helper para sanitizar propiedades (evita duplicar código)
    const sanitizeProperty = (prop: any) => {
      const { direccion, precios, imagenes, seo, ...rest } = prop;

      // 🔹 Manejar precios según tipoOperacion
      let precio;
      if (prop.tipoOperacion === 'ambos') {
        precio = {
          venta: {
            monto: precios.venta?.monto,
            moneda: precios.venta?.moneda,
            tipo: 'venta'
          },
          alquiler: {
            monto: precios.alquiler?.monto,
            moneda: precios.alquiler?.moneda,
            tipo: 'alquiler'
          },
          tipo: 'ambos'
        };
      } else if (prop.tipoOperacion === 'alquiler') {
        precio = {
          monto: precios.alquiler?.monto,
          moneda: precios.alquiler?.moneda,
          tipo: 'alquiler'
        };
      } else {
        precio = {
          monto: precios.venta?.monto,
          moneda: precios.venta?.moneda,
          tipo: 'venta'
        };
      }

      return {
        ...rest,
        tipoOperacion: prop.tipoOperacion, // ← Agregar este campo
        ubicacion: {
          barrio: direccion.barrio,
          ciudad: direccion.ciudad,
          provincia: direccion.provincia,
          zona: prop.zona,
          mostrarExacta: direccion.mostrarDireccionExacta,
          ...(direccion.mostrarDireccionExacta && {
            calle: direccion.calle,
            numero: direccion.numero,
          })
        },
        precio,
        imagen: imagenes?.find((img: any) => img.principal)?.url || imagenes?.[0]?.url,
        imagenes: imagenes || [],
        slug: seo?.slug,
      };
    };

    // 🔹 CASO 1: Búsqueda por slug (detalle de propiedad)
    if (slug) {
      const propiedades = await Property.find(baseQuery)
        .select('_id titulo descripcion tipoPropiedad tipoOperacion categoria direccion zona caracteristicas precios imagenes videoUrl destacado urgente fechaPublicacion seo')
        .limit(1)
        .lean();

      if (propiedades.length === 0) {
        return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
      }

      return NextResponse.json({
        propiedades: propiedades.map(sanitizeProperty),
        counts: countsByOperation,
        total: 1,
      });
    }

    // 🔹 CASO 2: Búsqueda por texto libre (?search=...)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      // 🔹 Construir query combinando filtros base + búsqueda textual
      // Los filtros específicos (tipoPropiedad, etc.) se mantienen FUERA del $or
      const finalQuery = {
        ...baseQuery,
        $or: [
          { titulo: { $regex: searchRegex } },
          { descripcion: { $regex: searchRegex } },
          { 'direccion.barrio': { $regex: searchRegex } },
          { 'direccion.ciudad': { $regex: searchRegex } },
          { 'direccion.provincia': { $regex: searchRegex } },
          // Solo incluir tipoPropiedad en $or si el search coincide con un tipo conocido
          ...(isKeywordAType(search) ? [{ tipoPropiedad: { $regex: searchRegex } }] : []),
        ]
      };
      // Función helper para verificar si el keyword es un tipo de propiedad (sin usar la API)

      const searchPropiedades = await Property.find(finalQuery)
        .select('_id titulo descripcion tipoPropiedad tipoOperacion categoria direccion zona caracteristicas precios imagenes videoUrl destacado urgente fechaPublicacion seo')
        .sort({ destacado: -1, fechaPublicacion: -1 })
        .limit(20)
        .lean();

      return NextResponse.json({
        propiedades: searchPropiedades.map(sanitizeProperty),
        counts: countsByOperation,
        total: searchPropiedades.length,
        query: 'search',
        keyword: search,
      });
    }

    // 🔹 CASO 3: Listado normal con filtros (sin búsqueda textual)
    const propiedades = await Property.find(baseQuery)
      .select('_id titulo descripcion tipoPropiedad tipoOperacion categoria direccion zona caracteristicas precios imagenes videoUrl destacado urgente fechaPublicacion seo')
      .sort({ destacado: -1, fechaPublicacion: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      propiedades: propiedades.map(sanitizeProperty),
      counts: countsByOperation,
      total: propiedades.length,
    });

  } catch (error: any) {
    console.error('Error en endpoint público de propiedades:', error);

    if (error.message?.includes('not found') || error.status === 404) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Error al cargar propiedades' }, { status: 500 });
  }
}

const isKeywordAType = (keyword: string): boolean => {
  const lowerKeyword = keyword.toLowerCase().trim();
  const knownTypes = ['departamento', 'casa', 'local', 'oficina', 'terreno', 'cochera', 'galpon', 'ph'];
  return knownTypes.includes(lowerKeyword);
};