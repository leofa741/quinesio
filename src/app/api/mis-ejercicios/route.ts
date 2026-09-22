import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import PlanEjercicios from '@/app/models/PlanEjercicios';

// ✅ IMPORTANTE: Importar el modelo Ejercicio para que Mongoose lo registre
// antes de hacer el populate, aunque no se use directamente aquí.
import '@/app/models/Ejercicio';

connectDB();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // Buscar los planes activos donde este usuario sea el paciente
    const planes = await PlanEjercicios.find({ 
      paciente: session.user.id,
      activo: true 
    })
      .populate('profesional', 'name lastName especialidades')
      .populate('ejercicios.ejercicioId', 'nombre categoria videoUrl descripcion')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, planes });
  } catch (error) {
    console.error('❌ Error al obtener mis ejercicios:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}