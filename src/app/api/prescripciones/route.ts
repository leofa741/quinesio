import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Prescripcion from '@/app/models/Prescripcion';
import User from '@/app/models/User';

connectDB();

// ✅ Generar código de verificación único
function generarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'KIN-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ✅ GET: Obtener prescripciones
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    const codigo = searchParams.get('codigo');

    // Si se busca por código de verificación (público)
    if (codigo) {
      const prescripcion = await Prescripcion.findOne({ 
        codigoVerificacion: codigo.toUpperCase() 
      })
        .populate('paciente', 'name lastName email')
        .populate('profesional', 'name lastName matricula especialidades');

      if (!prescripcion) {
        return NextResponse.json({ success: false, message: 'Prescripción no encontrada' }, { status: 404 });
      }

      // Verificar si está vencida
      if (prescripcion.estado === 'activa' && new Date() > prescripcion.fechaVencimiento) {
        prescripcion.estado = 'vencida';
        await prescripcion.save();
      }

      return NextResponse.json({ success: true, prescripcion });
    }

    // Si se busca por paciente
    if (pacienteId) {
      const prescripciones = await Prescripcion.find({ paciente: pacienteId })
        .populate('profesional', 'name lastName matricula')
        .sort({ fechaEmision: -1 });

      return NextResponse.json({ success: true, prescripciones });
    }

    // Si es profesional, ver sus prescripciones emitidas
    if (session.user?.role === 'profesionales') {
      const prescripciones = await Prescripcion.find({ profesional: session.user.id })
        .populate('paciente', 'name lastName')
        .sort({ fechaEmision: -1 })
        .limit(50);

      return NextResponse.json({ success: true, prescripciones });
    }

    // Si es admin, ver todas
    const prescripciones = await Prescripcion.find()
      .populate('paciente', 'name lastName')
      .populate('profesional', 'name lastName matricula')
      .sort({ fechaEmision: -1 })
      .limit(100);

    return NextResponse.json({ success: true, prescripciones });
  } catch (error) {
    console.error('Error GET prescripciones:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Crear nueva prescripción
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { pacienteId, diagnostico, prescripcion, indicaciones, contraindicaciones, diasValidez } = body;

    if (!pacienteId || !diagnostico || !prescripcion) {
      return NextResponse.json({ message: 'Paciente, diagnóstico y prescripción son requeridos' }, { status: 400 });
    }

    // Calcular fecha de vencimiento
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + (diasValidez || 30));

    // Generar código único
    let codigoVerificacion = generarCodigo();
    let existe = await Prescripcion.findOne({ codigoVerificacion });
    while (existe) {
      codigoVerificacion = generarCodigo();
      existe = await Prescripcion.findOne({ codigoVerificacion });
    }

    const nuevaPrescripcion = await Prescripcion.create({
      paciente: pacienteId,
      profesional: session.user.id,
      diagnostico,
      prescripcion,
      indicaciones: indicaciones || '',
      contraindicaciones: contraindicaciones || '',
      fechaEmision: new Date(),
      fechaVencimiento,
      estado: 'activa',
      codigoVerificacion,
      ipEmision: req.headers.get('x-forwarded-for') || 'unknown'
    });

    const prescripcionPopulada = await Prescripcion.findById(nuevaPrescripcion._id)
      .populate('paciente', 'name lastName email')
      .populate('profesional', 'name lastName matricula especialidades');

    return NextResponse.json({ success: true, prescripcion: prescripcionPopulada }, { status: 201 });
  } catch (error) {
    console.error('Error POST prescripcion:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ PATCH: Anular prescripción
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    const actualizada = await Prescripcion.findByIdAndUpdate(
      id,
      { estado: body.estado || 'anulada' },
      { new: true }
    );

    return NextResponse.json({ success: true, prescripcion: actualizada });
  } catch (error) {
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}