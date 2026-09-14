// app/api/alertas/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import AlertaModel from '@/app/models/Alerta';
import ClienteModel from '@/app/models/Cliente';
import PropiedadModel from '@/app/models/Property';


// 🔐 Middleware de autenticación
async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return { session, userId: session.user.id };
}

// ✅ GET: Listar alertas del usuario
export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const soloActivas = searchParams.get('activas') === 'true';
    
    const query: any = { 
      usuario: auth.userId,
      eliminado: false 
    };
    if (soloActivas) query.activo = true;
    
    const alertas = await AlertaModel.find(query)
      .populate('propiedad', 'titulo imagen precio ubicacion seo.slug')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(alertas);


    return NextResponse.json({ success: true, alertas });

  } catch (error) {
    console.error('❌ Error listando alertas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ✅ POST: Crear nueva alerta
export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const body = await req.json();
    const { tipo, propiedadId, criterios, frecuencia = 'diario' } = body;
    
    await connectDB();
    
    // Validaciones
    if (!tipo || !['propiedad', 'busqueda'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de alerta inválido' }, { status: 400 });
    }
    
    if (tipo === 'propiedad' && !propiedadId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }
    
    if (tipo === 'busqueda' && !criterios) {
      return NextResponse.json({ error: 'Criterios de búsqueda requeridos' }, { status: 400 });
    }
    
    // Verificar que la propiedad existe (si aplica)
    if (propiedadId) {
      const prop = await PropiedadModel.findById(propiedadId); 
      if (!prop) {
        return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
      }
    }
    
    // Vincular con Cliente si existe (para tener datos completos)
    let clienteId = null;
    const cliente = await ClienteModel.findOne({ email: auth.session.user.email });
    if (cliente) clienteId = cliente._id;
    
    // Crear alerta
    const nuevaAlerta = await AlertaModel.create({
      usuario: auth.userId,
      cliente: clienteId,
      tipo,
      propiedad: propiedadId || null,
      criterios: criterios || null,
      frecuencia,
      activo: true,
      eliminado: false
    });
    
    // Populate para devolver datos útiles
    const alertaCompleta = await AlertaModel.findById(nuevaAlerta._id)
      .populate('propiedad', 'titulo imagen precio ubicacion');
    
    return NextResponse.json(
      { success: true, alerta: alertaCompleta, message: '✅ Alerta creada' },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('❌ Error creando alerta:', error);
    
    // Manejo de errores específicos de MongoDB
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Ya tenés una alerta similar activa' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: 'Error al crear la alerta' }, { status: 500 });
  }
}

// ✅ PATCH: Actualizar alerta (activar/desactivar, cambiar frecuencia)
export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const alertaId = searchParams.get('id');
    
    if (!alertaId) {
      return NextResponse.json({ error: 'ID de alerta requerido' }, { status: 400 });
    }
    
    const body = await req.json();
    const { activo, frecuencia } = body;
    
    await connectDB();
    
    const alerta = await AlertaModel.findOneAndUpdate(
      { _id: alertaId, usuario: auth.userId, eliminado: false },
      { 
        ...(activo !== undefined && { activo }),
        ...(frecuencia && { frecuencia }),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!alerta) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, alerta });
    
  } catch (error) {
    console.error('❌ Error actualizando alerta:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// En app/api/alertas/route.ts, método DELETE:
export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const alertaId = searchParams.get('id'); // 👈 Ya lo tenés bien
    
    if (!alertaId) {
      return NextResponse.json({ error: 'ID de alerta requerido' }, { status: 400 });
    }
    
    await connectDB();
    
    const result = await AlertaModel.findOneAndUpdate(
      { _id: alertaId, usuario: auth.userId }, // 👈 Verifica que pertenece al usuario
      { eliminado: true, activo: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!result) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Alerta eliminada' });
    
  } catch (error) {
    console.error('❌ Error eliminando alerta:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}