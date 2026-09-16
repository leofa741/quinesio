import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import User from '@/app/models/User';
import connectDB from '@/app/lib/mongoose';
import { v2 as cloudinary } from 'cloudinary';

// ⚙️ Configuración de Cloudinary (usa las variables de entorno)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDB();

// ✅ GET: Obtener datos del perfil
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

// ✅ PUT: Actualizar el perfil con subida a Cloudinary
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    
    // 1. Campos básicos de texto
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

    // 2. Obra Social (viene como string JSON)
    const obraSocialStr = formData.get('obraSocial');
    if (obraSocialStr) {
      try {
        updateData.obraSocial = JSON.parse(obraSocialStr as string);
      } catch (e) {
        console.error('Error parseando obra social:', e);
      }
    }

    // 3. 🌩️ Manejo de la imagen con Cloudinary (Sin fs ni path)
    const imgFile = formData.get('img') as File | null;
    if (imgFile && imgFile.size > 0) {
      if (!imgFile.type.startsWith('image/')) {
        return NextResponse.json({ message: 'El archivo debe ser una imagen' }, { status: 400 });
      }
      if (imgFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ message: 'La imagen no puede superar los 5MB' }, { status: 400 });
      }

      // Convertir el archivo a Base64 para enviarlo a Cloudinary
      const bytes = await imgFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = `data:${imgFile.type};base64,${buffer.toString('base64')}`;

      // Subir a Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(base64Data, {
        folder: 'kinesiologia/perfiles', // Carpeta organizada en tu nube
        public_id: `profile_${session.user.id}_${Date.now()}`, // Nombre único
        transformation: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto' } // ⚡ Optimización y compresión automática
        ]
      });

      // Guardar la URL segura que nos devuelve Cloudinary en la base de datos
      updateData.img = uploadResponse.secure_url;
    }

    // 4. Actualizar en MongoDB
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