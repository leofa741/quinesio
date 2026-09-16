import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import User from '@/app/models/User';
import connectDB from '@/app/lib/mongoose';
import fs from 'fs';
import path from 'path';

connectDB();

// ✅ GET: Tu código original intacto
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const user = await User.findById(session.user.id).select('-password');
    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error en GET /api/profile:', error);
    return NextResponse.json({ message: 'Error al obtener el perfil' }, { status: 500 });
  }
}

// ✅ PUT: Nuevo método para actualizar el perfil
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    
    // Campos básicos
    const updateData: any = {
      name: formData.get('name'),
      lastName: formData.get('lastName'),
      email: formData.get('email')?.toString().toLowerCase(),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      zipCode: formData.get('zipCode'),
      fechaNacimiento: formData.get('fechaNacimiento'),
    };

    // Obra Social (viene como string JSON desde el frontend)
    const obraSocialStr = formData.get('obraSocial');
    if (obraSocialStr) {
      try {
        updateData.obraSocial = JSON.parse(obraSocialStr as string);
      } catch (e) {
        console.error('Error parseando obra social:', e);
      }
    }

    // Manejo de la imagen de perfil
    const imgFile = formData.get('img') as File | null;
    if (imgFile && imgFile.size > 0) {
      if (!imgFile.type.startsWith('image/')) {
        return NextResponse.json({ message: 'El archivo debe ser una imagen' }, { status: 400 });
      }
      if (imgFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ message: 'La imagen no puede superar los 5MB' }, { status: 400 });
      }

      const uploadDir = path.join(process.cwd(), 'public', 'img');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const bytes = await imgFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `profile-${session.user.id}-${Date.now()}.jpg`;
      const filePath = path.join(uploadDir, fileName);
      
      fs.writeFileSync(filePath, buffer);
      updateData.img = `/img/${fileName}`;
    }

    // Actualizar en MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Perfil actualizado con éxito', user: updatedUser });
  } catch (error) {
    console.error('Error en PUT /api/profile:', error);
    return NextResponse.json({ message: 'Error al actualizar el perfil' }, { status: 500 });
  }
}