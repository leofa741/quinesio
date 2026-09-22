import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Turno from '@/app/models/Turno';
import User from '@/app/models/User';

connectDB();

// ✅ GET: Obtener resumen y lista de turnos para liquidar
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const profesionalId = searchParams.get('profesionalId');
    const estadoPago = searchParams.get('estadoPago'); // 'pendiente' o 'todos'

    const query: any = { estado: 'completado' }; // Solo mostramos turnos ya atendidos
    
    if (profesionalId) query.profesional = profesionalId;
    if (estadoPago === 'pendiente') {
      query.$or = [
        { estadoPagoPaciente: 'pendiente' },
        { estadoPagoProfesional: 'pendiente' }
      ];
    }

    // Obtenemos los turnos y populamos los datos necesarios
    const turnos = await Turno.find(query)
      .populate('paciente', 'name lastName obraSocial')
      .populate('profesional', 'name lastName honorarios')
      .sort({ fechaInicio: -1 })
      .limit(100);

    // Calculamos totales para el dashboard
    const resumen = turnos.reduce((acc, turno: any) => {
      if (turno.estadoPagoPaciente === 'pendiente') acc.porCobrar += turno.montoTotal || 0;
      if (turno.estadoPagoProfesional === 'pendiente') acc.porPagar += turno.montoProfesional || 0;
      return acc;
    }, { porCobrar: 0, porPagar: 0 });

    return NextResponse.json({ success: true, turnos, resumen });
  } catch (error) {
    console.error('Error en API pagos:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ PATCH: Actualizar el estado de pago de un turno
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    const turnoActualizado = await Turno.findByIdAndUpdate(
      id,
      { 
        $set: {
          estadoPagoPaciente: body.estadoPagoPaciente,
          estadoPagoProfesional: body.estadoPagoProfesional,
          montoTotal: body.montoTotal,
          montoProfesional: body.montoProfesional,
          metodoPago: body.metodoPago,
          observacionesPago: body.observacionesPago
        }
      },
      { new: true }
    ).populate('paciente', 'name lastName')
     .populate('profesional', 'name lastName');

    return NextResponse.json({ success: true, turno: turnoActualizado });
  } catch (error) {
    console.error('Error actualizando pago:', error);
    return NextResponse.json({ message: 'Error al actualizar' }, { status: 500 });
  }
}