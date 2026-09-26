import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth'; // ⚠️ Verifica esta ruta
import cloudinary from '@/app/lib/cloudinary';
import Especialidad from '@/app/models/Especialidad';
import connectDB from '@/app/lib/mongoose';

connectDB();

interface CloudinaryUploadResult {
  secure_url: string;
}

// ✅ PUT - Actualizar una especialidad (Solo Admin)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name')?.toString().trim();
    const description = formData.get('description')?.toString().trim();
    const isActiveStr = formData.get('isActive')?.toString();
    const imgFile = formData.get('image') as File | null;

    const updateData: any = {};
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
    }
    if (description) updateData.description = description;
    if (isActiveStr !== undefined) updateData.isActive = isActiveStr === 'true';

    if (imgFile && imgFile.size > 0) {
      const arrayBuffer = await imgFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'especialidades' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(buffer);
      });
      updateData.image = (result as CloudinaryUploadResult).secure_url;
    }

    const updatedEspecialidad = await Especialidad.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true });
    if (!updatedEspecialidad) return NextResponse.json({ message: 'Especialidad no encontrada' }, { status: 404 });

    return NextResponse.json(updatedEspecialidad);
  } catch (error) {
    console.error('Error en PUT especialidad:', error);
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}

// ✅ DELETE - Eliminar (Soft Delete) una especialidad (Solo Admin)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const deletedEspecialidad = await Especialidad.findByIdAndUpdate(params.id, { isActive: false }, { new: true });
    if (!deletedEspecialidad) return NextResponse.json({ message: 'Especialidad no encontrada' }, { status: 404 });

    return NextResponse.json({ message: 'Especialidad eliminada correctamente' });
  } catch (error) {
    console.error('Error en DELETE especialidad:', error);
    return NextResponse.json({ message: 'Error al eliminar' }, { status: 500 });
  }
}