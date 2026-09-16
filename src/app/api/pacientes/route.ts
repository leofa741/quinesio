// app/api/pacientes/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import UserModel from '@/app/models/User'; // ✅ CORREGIDO: Usar UserModel, no PacienteModel
import { verifyRole } from '@/app/lib/auth';
import cloudinary from '@/app/lib/cloudinary';


// 🔹 GET: Listar pacientes (CORREGIDO - query más permisiva)
export async function GET(request: Request) {
  try {
    const admin = await verifyRole(request, ['admin', 'profesionales', 'administrativos']);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const obraSocial = searchParams.get('obraSocial') || '';
    const ciudad = searchParams.get('ciudad') || '';
    const activoParam = searchParams.get('activo');

    // 🔍 Query CORREGIDA: Manejar campo 'activo' opcional
    const query: any = { role: 'pacientes' };
    
    // Solo filtrar por activo si el parámetro fue explícitamente enviado
    if (activoParam !== null) {
      query.activo = activoParam !== 'false';
    }
    // Si activoParam es null, no filtramos por ese campo (incluye undefined)
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (obraSocial) {
      query['obraSocial.nombre'] = { $regex: obraSocial, $options: 'i' };
    }
    
    if (ciudad) {
      query.city = { $regex: ciudad, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    
    const [pacientes, total] = await Promise.all([
      UserModel.find(query)
        .sort({ lastName: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .select('-password -__v')
        .lean(),
      UserModel.countDocuments(query)
    ]);

    // 🔍 Log temporal para debug (eliminar después)
    console.log('🔍 [API] Query:', query);
    console.log('🔍 [API] Total encontrados:', total);

    return NextResponse.json({
      pacientes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error listando pacientes:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }

}

// 🔹 POST: Crear nuevo paciente (CORREGIDO para JSON)
export async function POST(request: Request) {
  try {
    const admin = await verifyRole(request, ['admin', 'profesionales', 'administrativos']);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    
    const body = await request.json(); // ✅ Siempre JSON
    
    // ✅ Construir obraSocial desde campos planos del frontend
    const { 
      obraSocial,           // nombre
      obraSocialCodigo, 
      obraSocialPlan, 
      obraSocialNumeroAfiliado,
      ...rest 
    } = body;

    // ✅ Solo crear objeto si hay al menos un valor
    const obraSocialObj = (obraSocial || obraSocialCodigo || obraSocialPlan || obraSocialNumeroAfiliado) 
      ? {
          nombre: obraSocial?.toString().trim() || '',
          codigo: obraSocialCodigo?.toString().trim() || '',
          plan: obraSocialPlan?.toString().trim() || '',
          numeroAfiliado: obraSocialNumeroAfiliado?.toString().trim() || '',
          activo: true,
        }
      : undefined;

    // ✅ Validaciones
    if (!body.name || !body.lastName || !body.email) {
      return NextResponse.json({ error: 'Nombre, apellido y email son obligatorios' }, { status: 400 });
    }

    const existe = await UserModel.findOne({ 
      email: body.email.toLowerCase(), 
      activo: true 
    });
    
    if (existe) {
      return NextResponse.json({ error: 'Ya existe un paciente con ese email' }, { status: 409 });
    }

    // ✅ Crear paciente
    const nuevoPaciente = await UserModel.create({
      name: body.name,
      lastName: body.lastName,
      email: body.email.toLowerCase(),
      phone: body.phone || '',
      city: body.city || '',
      address: body.address || '',
      zipCode: body.zipCode || '',
      img: body.img || '', // Si el frontend subió a Cloudinary, viene la URL
      role: 'pacientes',
      google: true,
      activo: true,
      creadoPor: admin.id,
      obraSocial: obraSocialObj, // ✅ Aquí se guarda correctamente
      diagnosticoPrincipal: body.diagnosticoPrincipal || '',
      fechaNacimiento: body.fechaNacimiento ? new Date(body.fechaNacimiento) : undefined,
      sesionesRealizadas: 0,
    });

    return NextResponse.json(nuevoPaciente, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error creando paciente:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email duplicado' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
// 🔹 DELETE: Soft delete (desactivar paciente)
export async function DELETE(request: Request) {
  try {
    const admin = await verifyRole(request, ['admin', 'profesionales', 'administrativos']);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // ✅ Soft delete: marcar como inactivo en lugar de borrar
    const result = await UserModel.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Paciente desactivado' });

  } catch (error) {
    console.error('Error desactivando paciente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}