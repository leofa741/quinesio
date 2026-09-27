import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import User from '@/app/models/User';
import connectDB from '@/app/lib/mongoose';
import bcrypt from 'bcryptjs';

connectDB();

const canManage = (role: string) => ['admin', 'administrativos'].includes(role);

// ✅ GET: Obtener profesionales (CORREGIDO para buscar por ID específico)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // 1. Si se solicita un ID específico, lo buscamos DIRECTAMENTE
    if (id) {
      // Un profesional solo puede ver su propio perfil
      if (session.user?.role === 'profesionales' && String(session.user.id) !== String(id)) {
        return NextResponse.json({ message: 'No tienes permiso para ver otros perfiles' }, { status: 403 });
      }
      
      const profesional = await User.findById(id).select('-password');
      if (!profesional) {
        return NextResponse.json({ message: 'Profesional no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, profesionales: [profesional] });
    }

    // 2. Si NO hay ID, devolvemos la lista
    if (session.user?.role === 'profesionales') {
      const profesional = await User.findById(session.user.id).select('-password');
      return NextResponse.json({ success: true, profesionales: profesional ? [profesional] : [] });
    }

    // Admin ve todos los profesionales, Y TAMBIÉN a los admins que tengan datos de profesional (matrícula)
    const profesionales = await User.find({ 
      $or: [
        { role: 'profesionales', activo: true },
        { role: 'admin', matricula: { $exists: true, $ne: '' } } 
      ]
    })
    .select('-password')
    .sort({ name: 1, lastName: 1 });

    return NextResponse.json({ success: true, profesionales });
  } catch (error) {
    console.error('Error GET /api/admin/profesionales:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Crear nuevo profesional O actualizar el actual si es el mismo email (Para Admins que también son profesionales)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canManage(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const emailLower = (body.email || '').toLowerCase().trim();

    const especialidades = body.especialidades 
      ? String(body.especialidades).split(',').map((e: string) => e.trim()).filter(Boolean) 
      : [];
    const horariosAtencion = body.horariosAtencion 
      ? String(body.horariosAtencion).split(',').map((h: string) => h.trim()).filter(Boolean) 
      : [];

    const datosProfesional = {
      matricula: body.matricula || '',
      especialidades,
      descripcionProfesional: body.descripcionProfesional || '',
      horariosAtencion,
      honorarios: {
        valorSesion: Number(body.honorarios?.valorSesion) || 0,
        valorEvaluacion: Number(body.honorarios?.valorEvaluacion) || 0,
        duracionSesion: Number(body.honorarios?.duracionSesion) || 60,
        moneda: body.honorarios?.moneda || 'ARS'
      },
      activo: true
    };

    // 🔍 Verificar si el email ya existe en la base de datos
    const usuarioExistente = await User.findOne({ email: emailLower });

    if (usuarioExistente) {
      // 🛠️ SOLUCIÓN 1: Si ya existe, ACTUALIZAMOS ese usuario agregándole los campos de profesional.
      // Esto permite que un Admin se agregue a sí mismo como profesional sin duplicar el correo.
      const actualizado = await User.findByIdAndUpdate(
        usuarioExistente._id,
        { $set: datosProfesional },
        { new: true }
      ).select('-password');

      return NextResponse.json({ 
        success: true, 
        profesional: actualizado, 
        message: 'Datos de profesional agregados a tu cuenta existente' 
      }, { status: 200 });
    }

    // Si no existe, creamos un nuevo usuario profesional normalmente
    const nuevoProfesional = await User.create({
      name: body.name || '',
      lastName: body.lastName || '',
      email: emailLower,
      password: await bcrypt.hash(body.password || '123456', 10),
      phone: body.phone || '',
      role: 'profesionales',
      ...datosProfesional
    });

    return NextResponse.json({ success: true, profesional: nuevoProfesional }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error POST /api/admin/profesionales:', error);
    return NextResponse.json({ message: error.message || 'Error al procesar profesional' }, { status: 500 });
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

    const sessionUserId = String(session.user?.id || '');
    const userRole = session.user?.role || '';

    if (userRole === 'profesionales' && sessionUserId !== id) {
      return NextResponse.json({ message: 'No autorizado: Solo puedes editar tu propio perfil' }, { status: 403 });
    }
    if (!canManage(userRole) && userRole !== 'profesionales') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    
    const especialidades = body.especialidades 
      ? String(body.especialidades).split(',').map((e: string) => e.trim()).filter(Boolean) 
      : [];
    const horariosAtencion = body.horariosAtencion 
      ? String(body.horariosAtencion).split(',').map((h: string) => h.trim()).filter(Boolean) 
      : [];

    const emailSanitizado = body.email ? String(body.email).trim().toLowerCase() : '';
    if (!emailSanitizado) {
      return NextResponse.json({ message: 'El email es requerido' }, { status: 400 });
    }

    // Validación inteligente de email (ignora al usuario actual)
    const emailEnUso = await User.findOne({ 
      email: emailSanitizado, 
      _id: { $ne: id }
    });

    if (emailEnUso) {
      return NextResponse.json({ message: 'El email ya está en uso por otro profesional' }, { status: 400 });
    }

    const updateData: any = {
      name: body.name || '',
      lastName: body.lastName || '',
      email: emailSanitizado,
      phone: body.phone || '',
      matricula: body.matricula || '',
      especialidades,
      descripcionProfesional: body.descripcionProfesional || '',
      horariosAtencion,
      honorarios: {
        valorSesion: Number(body.honorarios?.valorSesion) || 0,
        valorEvaluacion: Number(body.honorarios?.valorEvaluacion) || 0,
        duracionSesion: Number(body.honorarios?.duracionSesion) || 60,
        moneda: body.honorarios?.moneda || 'ARS'
      }
    };

    if (body.password && String(body.password).trim() !== '') {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const actualizado = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!actualizado) {
      return NextResponse.json({ message: 'Profesional no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profesional: actualizado });
  } catch (error: any) {
    console.error('❌ Error PUT /api/admin/profesionales:', error);
    return NextResponse.json({ message: error.message || 'Error al actualizar' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar profesional
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