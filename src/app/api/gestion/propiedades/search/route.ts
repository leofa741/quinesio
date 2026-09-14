// app/api/gestion/propiedades/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Property from '@/app/models/Property';

connectDB();

const isAuthorized = (role: string) => ['admin', 'superadmin', 'agente', 'vendedor'].includes(role);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAuthorized(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    
    if (!q || q.length < 2) {
      return NextResponse.json({ propiedades: [], hint: 'Escribí al menos 2 caracteres para buscar' });
    }

    // Búsqueda textual con índice text + filtros adicionales
    const query: any = { 
      $text: { $search: q },
      activo: true 
    };

    // Filtros adicionales desde query params
    const tipoPropiedad = searchParams.get('tipoPropiedad');
    const tipoOperacion = searchParams.get('tipoOperacion');
    const barrio = searchParams.get('barrio');
    
    if (tipoPropiedad) query.tipoPropiedad = tipoPropiedad;
    if (tipoOperacion) query.tipoOperacion = tipoOperacion;
    if (barrio) query['direccion.barrio'] = { $regex: barrio, $options: 'i' };

    // Si es agente, solo ver sus propiedades
    if (session.user.role === 'agente') {
      query.agente = session.user.id;
    }

    const propiedades = await Property.find(query)
      .select('_id titulo tipoPropiedad tipoOperacion direccion precios estado destacado urgente imagenes')
      .populate('agente', 'name email')
      .limit(50)
      .lean();

    // Hint para el frontend
    let hint = null;
    if (propiedades.length === 0) {
      hint = `No se encontraron propiedades para "${q}"`;
    } else if (propiedades.length >= 50) {
      hint = `Mostrando los primeros 50 resultados para "${q}"`;
    }

    return NextResponse.json(
      { propiedades, hint },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error en búsqueda de propiedades:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}