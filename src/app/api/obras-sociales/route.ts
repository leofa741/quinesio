import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import ObraSocial from '@/app/models/ObraSocial';

connectDB();

// ✅ GET: Obtener todas las obras sociales (activas o todas)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const soloActivas = searchParams.get('activas') === 'true';

    const query = soloActivas ? { activo: true } : {};
    const obrasSociales = await ObraSocial.find(query).sort({ nombre: 1 });

    return NextResponse.json({ success: true, obrasSociales });
  } catch (error) {
    console.error('Error GET /api/obras-sociales:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Crear nueva obra social
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { nombre, codigo, planes } = body;

    if (!nombre || !codigo) {
      return NextResponse.json({ message: 'Nombre y código son requeridos' }, { status: 400 });
    }

    const nuevaOS = await ObraSocial.create({
      nombre,
      codigo,
      planes: planes || []
    });

    return NextResponse.json({ success: true, obraSocial: nuevaOS }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/obras-sociales:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'Ya existe una obra social con ese código' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al crear la obra social' }, { status: 500 });
  }
}

// ✅ PUT: Actualizar obra social
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: 'ID requerido' }, { status: 400 });
    }

    const body = await req.json();
    const actualizada = await ObraSocial.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!actualizada) {
      return NextResponse.json({ message: 'Obra social no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, obraSocial: actualizada });
  } catch (error) {
    console.error('Error PUT /api/obras-sociales:', error);
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar obra social (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: 'ID requerido' }, { status: 400 });
    }

    await ObraSocial.findByIdAndUpdate(id, { activo: false });

    return NextResponse.json({ success: true, message: 'Obra social desactivada' });
  } catch (error) {
    console.error('Error DELETE /api/obras-sociales:', error);
    return NextResponse.json({ message: 'Error al eliminar' }, { status: 500 });
  }
}