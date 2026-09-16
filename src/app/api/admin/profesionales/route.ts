import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import User from '@/app/models/User';
import connectDB from '@/app/lib/mongoose';
import bcrypt from 'bcryptjs';

connectDB();

// Helper para verificar permisos de gestión
const canManage = (role: string) => ['admin', 'administrativos'].includes(role);

// ✅ GET: Obtener profesionales
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Si es un profesional, solo puede ver su propio perfil
    if (session.user?.role === 'pacientes' || session.user?.role === 'profesionales') {
      if (id && id !== session.user.id) {
        return NextResponse.json({ message: 'No tienes permiso para ver este perfil' }, { status: 403 });
      }
      const profesional = await User.findById(session.user.id).select('-password');
      return NextResponse.json({ success: true, profesionales: [profesional] });
    }

    // Admin/Administrativo puede ver todos o uno específico por ID
    if (id) {
      const profesional = await User.findById(id).select('-password');
      return NextResponse.json({ success: true, profesionales: [profesional] });
    }

    const profesionales = await User.find({ role: 'profesionales' }).select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, profesionales });
  } catch (error) {
    console.error('Error GET /api/admin/profesionales:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Crear nuevo profesional (Solo Admin/Administrativo)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canManage(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    
    // Procesar arrays desde strings separados por coma
    const especialidades = body.especialidades ? body.especialidades.split(',').map((e: string) => e.trim()).filter(Boolean) : [];
    const horariosAtencion = body.horariosAtencion ? body.horariosAtencion.split(',').map((h: string) => h.trim()).filter(Boolean) : [];

    const nuevoProfesional = await User.create({
      name: body.name,
      lastName: body.lastName,
      email: body.email.toLowerCase(),
      password: await bcrypt.hash(body.password || '123456', 10),
      phone: body.phone,
      role: 'profesionales',
      activo: true,
      matricula: body.matricula,
      especialidades,
      descripcionProfesional: body.descripcionProfesional,
      horariosAtencion,
      honorarios: {
        valorSesion: Number(body.honorarios?.valorSesion) || 0,
        valorEvaluacion: Number(body.honorarios?.valorEvaluacion) || 0,
        duracionSesion: Number(body.honorarios?.duracionSesion) || 60,
        moneda: body.honorarios?.moneda || 'ARS'
      }
    });

    return NextResponse.json({ success: true, profesional: nuevoProfesional }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin/profesionales:', error);
    return NextResponse.json({ message: 'Error al crear profesional' }, { status: 500 });
  }
}

// ✅ PUT: Actualizar profesional
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    // Seguridad: Un profesional solo puede editar su propio perfil
    if (session.user?.role === 'profesionales' && session.user.id !== id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    if (!canManage(session.user?.role || '') && session.user?.role !== 'profesionales') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const especialidades = body.especialidades ? body.especialidades.split(',').map((e: string) => e.trim()).filter(Boolean) : [];
    const horariosAtencion = body.horariosAtencion ? body.horariosAtencion.split(',').map((h: string) => h.trim()).filter(Boolean) : [];

    const actualizado = await User.findByIdAndUpdate(
      id,
      {
        name: body.name,
        lastName: body.lastName,
        email: body.email.toLowerCase(),
        phone: body.phone,
        matricula: body.matricula,
        especialidades,
        descripcionProfesional: body.descripcionProfesional,
        horariosAtencion,
        honorarios: {
          valorSesion: Number(body.honorarios?.valorSesion) || 0,
          valorEvaluacion: Number(body.honorarios?.valorEvaluacion) || 0,
          duracionSesion: Number(body.honorarios?.duracionSesion) || 60,
          moneda: body.honorarios?.moneda || 'ARS'
        }
      },
      { new: true }
    ).select('-password');

    return NextResponse.json({ success: true, profesional: actualizado });
  } catch (error) {
    console.error('Error PUT /api/admin/profesionales:', error);
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar profesional (Solo Admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Solo administradores pueden eliminar' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Profesional eliminado' });
  } catch (error) {
    console.error('Error DELETE /api/admin/profesionales:', error);
    return NextResponse.json({ message: 'Error al eliminar' }, { status: 500 });
  }
}