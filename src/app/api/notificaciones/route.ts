import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth'; // Ajusta la ruta si es necesario
import connectDB from '@/app/lib/mongoose';   // Ajusta la ruta si es necesario
import Notificacion from '@/app/models/Notificacion'; // Ajusta la ruta si es necesario

connectDB();

// ✅ GET: Obtener las alertas del usuario logueado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const preferencias = await Notificacion.find({ usuario: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, preferencias });
  } catch (error) {
    console.error('Error GET /api/notificaciones:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Crear una nueva alerta
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    
    const nuevaNotificacion = await Notificacion.create({
      usuario: session.user.id,
      tipo: body.tipo || 'turno_libre',
      profesional: body.profesional,
      tratamiento: body.tratamiento,
      diasPreferidos: body.diasPreferidos || [],
      canal: body.canal || 'email',
      activo: true,
    });

    return NextResponse.json({ success: true, preferencia: nuevaNotificacion }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/notificaciones:', error);
    return NextResponse.json({ success: false, error: 'Error al crear' }, { status: 500 });
  }
}

// ✅ PATCH: Activar o desactivar una alerta
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    // Verificar que la alerta pertenezca al usuario (Seguridad)
    const alerta = await Notificacion.findOne({ _id: id, usuario: session.user.id });
    if (!alerta) {
      return NextResponse.json({ success: false, error: 'No encontrada o sin permisos' }, { status: 404 });
    }

    const actualizada = await Notificacion.findByIdAndUpdate(
      id,
      { activo: body.activo },
      { new: true }
    );

    return NextResponse.json({ success: true, preferencia: actualizada });
  } catch (error) {
    console.error('Error PATCH /api/notificaciones:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar una alerta
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    // Verificar propiedad antes de borrar
    const alerta = await Notificacion.findOne({ _id: id, usuario: session.user.id });
    if (!alerta) {
      return NextResponse.json({ success: false, error: 'No encontrada o sin permisos' }, { status: 404 });
    }

    await Notificacion.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Eliminada con éxito' });
  } catch (error) {
    console.error('Error DELETE /api/notificaciones:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar' }, { status: 500 });
  }
}