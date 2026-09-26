import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import Actividad from '@/app/models/Actividad';
import connectDB from '@/app/lib/mongoose';

connectDB();

// ✅ GET - Obtener todas las actividades
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['admin', 'profesionales', 'administrativos'].includes(userRole)) {
      return NextResponse.json({ message: 'Acceso no autorizado' }, { status: 403 });
    }

    const query: any = {};
    if (userRole === 'profesionales') {
      query.profesionalId = (session.user as any).id; 
    }

    const actividades = await Actividad.find(query).sort({ fecha: -1 }).lean();
    return NextResponse.json(actividades);
  } catch (error) {
    console.error('Error en GET actividades:', error);
    return NextResponse.json({ message: 'Error al obtener actividades' }, { status: 500 });
  }
}

// ✅ POST - Registrar una nueva actividad
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['admin', 'profesionales', 'administrativos'].includes(userRole)) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const { turnoId, profesionalId, profesionalNombre, pacienteNombre, fecha, duracionMinutos, tipoSesion, notas } = body;

    if (!profesionalId || !pacienteNombre || !fecha || !duracionMinutos || !tipoSesion) {
      return NextResponse.json({ message: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const nuevaActividad = await Actividad.create({
      turnoId: turnoId || null,
      profesionalId,
      profesionalNombre,
      pacienteNombre,
      fecha: new Date(fecha),
      duracionMinutos: Number(duracionMinutos),
      tipoSesion,
      notas: notas || '',
      estado: 'Completada',
    });

    return NextResponse.json(nuevaActividad, { status: 201 });
  } catch (error) {
    console.error('Error en POST actividad:', error);
    return NextResponse.json({ message: 'Error al registrar la actividad' }, { status: 500 });
  }
}