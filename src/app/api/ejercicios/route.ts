import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Ejercicio from '@/app/models/Ejercicio';

connectDB();

// ✅ GET: Obtener la librería de ejercicios
export async function GET() {
  try {
    const ejercicios = await Ejercicio.find({ activo: true }).sort({ categoria: 1, nombre: 1 });
    return NextResponse.json({ success: true, ejercicios });
  } catch (error) {
    console.error('❌ Error al obtener ejercicios:', error);
    return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Agregar un nuevo ejercicio a la librería
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { nombre, categoria, videoUrl, descripcion } = body;

    if (!nombre || !categoria) {
      return NextResponse.json({ message: 'Nombre y categoría son requeridos' }, { status: 400 });
    }

    const nuevoEjercicio = await Ejercicio.create({
      nombre,
      categoria,
      videoUrl: videoUrl || '',
      descripcion: descripcion || '',
      activo: true
    });

    return NextResponse.json({ success: true, ejercicio: nuevoEjercicio }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creando ejercicio:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}