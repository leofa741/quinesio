import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Turno from '@/app/models/Turno';

connectDB();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const turnos = await Turno.find({ paciente: session.user.id })
      .populate('profesional', 'name lastName especialidades')
      .sort({ fechaInicio: -1 })
      .lean();

    return NextResponse.json({ success: true, turnos });
  } catch (error) {
    console.error('Error GET /api/turnos/mis-turnos:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}