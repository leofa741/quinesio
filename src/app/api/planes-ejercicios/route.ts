import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import PlanEjercicios from '@/app/models/PlanEjercicios';

connectDB();



export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { pacienteId, fechaInicio, fechaFin, notasGenerales, ejercicios } = body;

    if (!pacienteId || !ejercicios || ejercicios.length === 0) {
      return NextResponse.json({ message: 'Paciente y al menos un ejercicio son requeridos' }, { status: 400 });
    }

    const nuevoPlan = await PlanEjercicios.create({
      paciente: pacienteId,
      profesional: session.user.id,
      fechaInicio,
      fechaFin: fechaFin || null,
      notasGenerales: notasGenerales || '',
      ejercicios,
      activo: true
    });

    return NextResponse.json({ success: true, plan: nuevoPlan }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creando plan de ejercicios:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// GET para obtener los planes de un paciente o del profesional
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');

    const query: any = { activo: true };
    if (pacienteId) {
      query.paciente = pacienteId;
    } else {
      // Si no se pasa paciente, mostrar los que el profesional creó
      query.profesional = session.user.id;
    }

    const planes = await PlanEjercicios.find(query)
      .populate('paciente', 'name lastName')
      .populate('profesional', 'name lastName')
      .populate('ejercicios.ejercicioId', 'nombre categoria videoUrl')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, planes });
  } catch (error) {
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}