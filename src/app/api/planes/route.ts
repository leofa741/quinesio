import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import PlanTratamiento from '@/app/models/PlanTratamiento';

connectDB();

// ✅ GET: Obtener lista de planes (según rol) o buscar planes de un paciente
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    const profesionalIdParam = searchParams.get('profesionalId');

    // 1. Búsqueda de planes activos de un paciente específico (Devuelve ARRAY para soportar múltiples dolencias)
    if (pacienteId && profesionalIdParam) {
      const planes = await PlanTratamiento.find({
        paciente: pacienteId,
        profesional: profesionalIdParam,
        estado: 'activo'
      }).populate('paciente', 'name lastName').populate('profesional', 'name lastName').sort({ createdAt: -1 });

      return NextResponse.json({ success: true, planes });
    }

    // 2. Listado general de planes (para la página de sesiones)
    const query: any = { estado: 'activo' };
    if (session.user?.role === 'profesionales') {
      query.profesional = session.user.id;
    }

    const planesLista = await PlanTratamiento.find(query)
      .populate('paciente', 'name lastName')
      .populate('profesional', 'name lastName')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, planes: planesLista });

  } catch (error) {
    console.error('Error GET /api/planes:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Crear un nuevo Plan de Tratamiento
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { pacienteId, profesionalId, diagnostico, objetivo, totalSesiones } = body;

    if (!pacienteId || !profesionalId || !diagnostico || !totalSesiones) {
      return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    const nuevoPlan = await PlanTratamiento.create({
      paciente: pacienteId,
      profesional: profesionalId,
      diagnostico,
      objetivo: objetivo || 'Rehabilitación y mejora funcional',
      totalSesiones: Number(totalSesiones),
      sesionesCompletadas: 0,
      estado: 'activo'
    });

    return NextResponse.json({ success: true, plan: nuevoPlan }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/planes:', error);
    return NextResponse.json({ message: 'Error al crear el plan' }, { status: 500 });
  }
}