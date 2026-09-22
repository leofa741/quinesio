import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import Prescripcion from '@/app/models/Prescripcion';

connectDB();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codigo = searchParams.get('codigo');

    if (!codigo) {
      return NextResponse.json({ success: false, message: 'Código de verificación requerido' }, { status: 400 });
    }

    // Buscar la prescripción y traer solo datos seguros para verificación pública
    const prescripcion = await Prescripcion.findOne({ 
      codigoVerificacion: codigo.toUpperCase().trim() 
    })
    .populate('paciente', 'name lastName') // Solo nombre, sin email/teléfono
    .populate('profesional', 'name lastName matricula especialidades'); // Solo datos profesionales públicos

    if (!prescripcion) {
      return NextResponse.json({ 
        success: false, 
        message: 'Código no encontrado. La prescripción puede ser inválida o no existir en nuestro sistema.' 
      }, { status: 404 });
    }

    // Verificar vencimiento en tiempo real
    let estadoActual = prescripcion.estado;
    if (estadoActual === 'activa' && new Date(prescripcion.fechaVencimiento) < new Date()) {
      estadoActual = 'vencida';
    }

    // Retornar únicamente la información necesaria para validar autenticidad
    return NextResponse.json({
      success: true,
      data: {
        codigoVerificacion: prescripcion.codigoVerificacion,
        estado: estadoActual,
        fechaEmision: prescripcion.fechaEmision,
        fechaVencimiento: prescripcion.fechaVencimiento,
        paciente: prescripcion.paciente,
        profesional: prescripcion.profesional,
        diagnostico: prescripcion.diagnostico,
        prescripcion: prescripcion.prescripcion
      }
    });
  } catch (error) {
    console.error('Error verificando prescripción:', error);
    return NextResponse.json({ success: false, message: 'Error del servidor al verificar' }, { status: 500 });
  }
}