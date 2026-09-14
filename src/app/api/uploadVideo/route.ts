import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún video.' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'El archivo debe ser un video.' }, { status: 400 });
    }

    // Validar tamaño (100MB máximo)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'El video no puede superar los 100MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary como video
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'properties/videos',
          resource_type: 'video',
          eager: [
            { format: 'webm', transformation: [{ quality: 'auto:good' }] },
            { format: 'mp4', transformation: [{ quality: 'auto:good' }] }
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const cloudinaryResult = result as any;

    return NextResponse.json({
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      duration: cloudinaryResult.duration,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      thumbnail: cloudinaryResult.thumbnail_url || null,
    });
  } catch (error) {
    console.error('Error al subir video:', error);
    return NextResponse.json({ error: 'Error interno al subir el video.' }, { status: 500 });
  }
}

// Aumentar el límite de tamaño del body para videos
export const config = {
  api: {
    bodyParser: false,
  },
};