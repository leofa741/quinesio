import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import NotaSesion from '@/app/models/NotaSesion';
import PlanTratamiento from '@/app/models/PlanTratamiento';
import Turno from '@/app/models/Turno';

connectDB();


// Agrega esto a tu archivo app/api/sesiones/route.ts

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ message: 'planId es requerido' }, { status: 400 });
    }

    const sesiones = await NotaSesion.find({ planTratamiento: planId })
      .sort({ numeroSesion: -1 }); // Ordenar de la más reciente a la más antigua

    return NextResponse.json({ success: true, sesiones });
  } catch (error) {
    console.error('Error GET /api/sesiones:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Registrar una sesión clínica y actualizar el plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { planTratamientoId, pacienteId, profesionalId, turnoId, dolorEva, tecnicasAplicadas, evolucion, proximosPasos } = body;

    if (!planTratamientoId || !pacienteId || !profesionalId || !tecnicasAplicadas || !evolucion) {
      return NextResponse.json({ message: 'Faltan datos requeridos' }, { status: 400 });
    }

    // 1. Obtener el plan para saber el número de sesión actual
    const plan = await PlanTratamiento.findById(planTratamientoId);
    if (!plan) {
      return NextResponse.json({ message: 'Plan de tratamiento no encontrado' }, { status: 404 });
    }

    if (plan.estado !== 'activo') {
      return NextResponse.json({ message: 'El plan ya está finalizado o suspendido' }, { status: 400 });
    }

    // 2. Calcular el número de esta sesión
    const numeroSesion = plan.sesionesCompletadas + 1;

    // 3. Crear la nota de la sesión
    const nuevaNota = await NotaSesion.create({
      planTratamiento: planTratamientoId,
      paciente: pacienteId,
      profesional: profesionalId,
      turnoId: turnoId || null,
      numeroSesion,
      fecha: new Date(),
      dolorEva: dolorEva ? Number(dolorEva) : null,
      tecnicasAplicadas,
      evolucion,
      proximosPasos: proximosPasos || ''
    });

    // 4. Actualizar el contador del plan
    plan.sesionesCompletadas = numeroSesion;
    if (numeroSesion >= plan.totalSesiones) {
      plan.estado = 'finalizado';
    }
    await plan.save();

    // 5. (Opcional pero recomendado) Marcar el turno asociado como 'completado'
    if (turnoId) {
      await Turno.findByIdAndUpdate(turnoId, { estado: 'completado' });
    }

    return NextResponse.json({ 
      success: true, 
      nota: nuevaNota,
      planActualizado: plan 
    }, { status: 201 });

  } catch (error) {
    console.error('Error POST /api/sesiones:', error);
    return NextResponse.json({ message: 'Error al registrar la sesión' }, { status: 500 });
  }
}