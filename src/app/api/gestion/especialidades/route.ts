import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth'; // ⚠️ Asegúrate de que esta ruta sea la correcta a tu archivo de configuración de NextAuth
import cloudinary from '@/app/lib/cloudinary';
import Especialidad from '@/app/models/Especialidad';
import connectDB from '@/app/lib/mongoose';

connectDB();

interface CloudinaryUploadResult {
  secure_url: string;
}

// ✅ GET - Obtener todas las especialidades activas
export async function GET() {
  try {
  

    const especialidades = await Especialidad.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json(especialidades);
  } catch (error) {
    console.error('Error en GET especialidades:', error);
    return NextResponse.json({ message: 'Error al obtener las especialidades' }, { status: 500 });
  }
}

// ✅ POST - Crear una nueva especialidad (Solo Admin)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ message: 'Acceso denegado. Solo administradores.' }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name')?.toString().trim() || '';
    const description = formData.get('description')?.toString().trim() || '';
    const imgFile = formData.get('image') as File | null;

    if (!name || !description) {
      return NextResponse.json({ message: 'Nombre y descripción son requeridos' }, { status: 400 });
    }

    const slug = (formData.get('slug')?.toString().trim() || name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    let imgUrl = null;
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
      imgUrl = (result as CloudinaryUploadResult).secure_url;
    }

    const nuevaEspecialidad = await Especialidad.create({
      name,
      slug,
      description,
      image: imgUrl,
      count: 0,
      isActive: true,
    });

    return NextResponse.json(nuevaEspecialidad, { status: 201 });
  } catch (error) {
    console.error('Error en POST especialidad:', error);
    return NextResponse.json({ message: 'Error al crear la especialidad' }, { status: 500 });
  }
}