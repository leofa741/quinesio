import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Notificacion from '@/app/models/Notificacion';

connectDB();

// ✅ GET: Obtener todas las alertas (Solo Admin y Administrativos)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const profesionalId = searchParams.get('profesionalId');
    const estado = searchParams.get('estado'); // 'activo' o 'inactivo'

    const query: any = {};

    if (profesionalId) {
      // Asumimos que guardas el ID del profesional, si solo guardas el nombre, ajusta la query
      query['profesional.nombre'] = { $regex: profesionalId, $options: 'i' }; 
    }
    if (estado === 'activo') query.activo = true;
    if (estado === 'inactivo') query.activo = false;

    // 🔑 CLAVE: Hacemos 'populate' del usuario para saber quién es el paciente
    const alertas = await Notificacion.find(query)
      .populate('usuario', 'name lastName email phone') 
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, alertas });
  } catch (error) {
    console.error('Error GET /api/admin/lista-espera:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ PATCH: Activar/Desactivar alerta desde el admin
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    const actualizada = await Notificacion.findByIdAndUpdate(
      id,
      { activo: body.activo },
      { new: true }
    ).populate('usuario', 'name lastName');

    return NextResponse.json({ success: true, alerta: actualizada });
  } catch (error) {
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar alerta (ej: cuando ya se le dio el turno al paciente)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    await Notificacion.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Alerta eliminada' });
  } catch (error) {
    return NextResponse.json({ message: 'Error al eliminar' }, { status: 500 });
  }
}