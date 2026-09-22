 

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import NotaSesion from '@/app/models/NotaSesion';
import PlanTratamiento from '@/app/models/PlanTratamiento';
import Turno from '@/app/models/Turno';
// Nota: PlanTratamiento y Turno los puedes dejar si los usas en el POST, si no, no afectan.

connectDB();

// ✅ GET: Ahora es FLEXIBLE. Acepta planId (para el modal) o pacienteId (para evolución)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');
    const pacienteId = searchParams.get('pacienteId');
    const profesionalId = searchParams.get('profesionalId');

    const query: any = {};

    // 1. Lógica de búsqueda flexible
    if (pacienteId) {
      query.paciente = pacienteId; // Para la página de Evolución Visual
    } else if (planId) {
      query.planTratamiento = planId; // Para el modal de Registro de Sesión (tu código actual)
    } else {
      return NextResponse.json({ message: 'Se requiere planId o pacienteId' }, { status: 400 });
    }

    // 2. Filtro adicional opcional por profesional
    if (profesionalId) {
      query.profesional = profesionalId;
    }

    // 3. Búsqueda con Populates para traer nombre del paciente y profesional
    const sesiones = await NotaSesion.find(query)
      .populate('paciente', 'name lastName')
      .populate('profesional', 'name lastName')
      .sort({ fecha: -1 }); // Orden cronológico inverso (más reciente primero)

    return NextResponse.json({ success: true, sesiones });
  } catch (error) {
    console.error('Error GET /api/sesiones:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Se mantiene igual para crear la sesión (no lo toques si ya te funciona)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { planTratamientoId, pacienteId, profesionalId, turnoId, dolorEva, tecnicasAplicadas, evolucion, proximosPasos } = body;

    if (!planTratamientoId || !pacienteId || !profesionalId) {
      return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Obtener el plan para saber el número de sesión actual
    const plan = await PlanTratamiento.findById(planTratamientoId);
    if (!plan) {
      return NextResponse.json({ message: 'Plan de tratamiento no encontrado' }, { status: 404 });
    }

    const nuevaSesion = await NotaSesion.create({
      planTratamiento: planTratamientoId,
      paciente: pacienteId,
      profesional: profesionalId,
      turno: turnoId || null,
      numeroSesion: (plan.sesionesCompletadas || 0) + 1,
      fecha: new Date(),
      dolorEva: dolorEva || 0,
      tecnicasAplicadas,
      evolucion,
      proximosPasos
    });

    // Actualizar el contador de sesiones del plan
    await PlanTratamiento.findByIdAndUpdate(planTratamientoId, {
      $inc: { sesionesCompletadas: 1 }
    });

    // Si hay un turno asociado, marcarlo como completado
    if (turnoId) {
      await Turno.findByIdAndUpdate(turnoId, { estado: 'completado' });
    }

    return NextResponse.json({ success: true, sesion: nuevaSesion }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/sesiones:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}