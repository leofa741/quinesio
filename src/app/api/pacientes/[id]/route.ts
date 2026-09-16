// app/api/pacientes/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import UserModel, { IUser } from '@/app/models/User'; // ✅ Importar también la interfaz
import { verifyRole } from '@/app/lib/auth';
import cloudinary from '@/app/lib/cloudinary';

interface CloudinaryUploadResult {
  secure_url: string;
}

// 🔹 GET: Obtener detalle de un paciente
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ Next.js 15+: params es Promise
) {
  try {
    const admin = await verifyRole(request, ['admin', 'profesionales', 'administrativos']);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    
    // ✅ Resolver params (Next.js 15+)
    const { id } = await params;
    
    // ✅ Tipar explícitamente el resultado
    const paciente = await UserModel.findById(id)
      .select('-password -__v')
      .lean() as unknown as IUser | null;
    
    if (!paciente) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // ✅ Ahora TypeScript sabe que paciente tiene .role
    if (paciente.role !== 'pacientes') {
      return NextResponse.json({ error: 'Este usuario no es un paciente' }, { status: 400 });
    }

    return NextResponse.json(paciente);

  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// 🔹 PUT: Editar paciente (datos + role + archivos)
// 🔹 PUT: Editar paciente (CORREGIDO para manejar obraSocial como objeto)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyRole(request, ['admin', 'profesionales', 'administrativos']);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    
    const formData = await request.formData();
    
    const updateData: any = {};
    
    // ✅ Campos de texto simples
    const textFields = ['name', 'lastName', 'email', 'phone', 'address', 'city', 'zipCode', 'diagnosticoPrincipal', 'fechaNacimiento'];
    textFields.forEach(field => {
      const value = formData.get(field)?.toString().trim();
      if (value !== undefined && value !== null) {
        updateData[field] = field === 'email' ? value.toLowerCase() : value;
      }
    });
    
    // ✅ Checkbox activo
    const activo = formData.get('activo');
    if (activo !== null) {
      updateData.activo = activo === 'true';
    }
    
    // ✅ Manejar obraSocial como objeto JSON anidado
    const obraSocialJson = formData.get('obraSocial');
    if (obraSocialJson) {
      try {
        const obraSocialData = JSON.parse(obraSocialJson as string);
        updateData.obraSocial = obraSocialData;
      } catch (e) {
        console.error('Error parsing obraSocial JSON:', e);
      }
    }
    
    // ✅ Subir archivo a Cloudinary si se adjuntó
    const imgFile = formData.get('img') as File | null;
    
    if (imgFile && imgFile.size > 0) {
      const arrayBuffer = await imgFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'pacientes/fotos' },
          (error, result) => error ? reject(error) : resolve(result as CloudinaryUploadResult)
        ).end(buffer);
      });
      
      updateData.img = result.secure_url;
    }

    // ✅ Actualizar en MongoDB
    const updated = await UserModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -__v')
      .lean() as unknown as IUser | null;

    if (!updated) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);

  } catch (error: any) {
    console.error('Error actualizando paciente:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// 🔹 DELETE: Soft delete (desactivar paciente)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ Next.js 15+
) {
  try {
    const admin = await verifyRole(request, ['admin', 'profesionales', 'administrativos']);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    
    const { id } = await params;
    
    // ✅ Soft delete: marcar como inactivo
    const result = await UserModel.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    ).lean() as unknown as IUser | null;

    if (!result) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Paciente desactivado', paciente: result });

  } catch (error) {
    console.error('Error desactivando paciente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}