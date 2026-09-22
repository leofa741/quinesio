import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Turno from '@/app/models/Turno';

connectDB();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'profesionales', 'administrativos'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    const profesionalId = searchParams.get('profesionalId');
    const estado = searchParams.get('estado');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const busqueda = searchParams.get('busqueda');

    const query: any = {};

    // Filtros
    if (pacienteId) query.paciente = pacienteId;
    if (profesionalId) query.profesional = profesionalId;
    if (estado && estado !== 'todos') query.estado = estado;
    
    if (fechaDesde || fechaHasta) {
      query.fechaInicio = {};
      if (fechaDesde) query.fechaInicio.$gte = new Date(fechaDesde);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        query.fechaInicio.$lte = hasta;
      }
    }

    // Si es profesional, solo ve sus propios turnos (a menos que sea admin)
    if (session.user?.role === 'profesionales' && !profesionalId) {
      query.profesional = session.user.id;
    }

    // Búsqueda por nombre de paciente (requiere lookup)
    let turnos;
    if (busqueda && busqueda.length >= 2) {
      turnos = await Turno.find(query)
        .populate('paciente', 'name lastName email phone')
        .populate('profesional', 'name lastName')
        .sort({ fechaInicio: -1 })
        .limit(100);
      
      // Filtrar por búsqueda en nombre del paciente
      const regex = new RegExp(busqueda, 'i');
      turnos = turnos.filter((t: any) => 
        regex.test(t.paciente?.name) || 
        regex.test(t.paciente?.lastName) ||
        regex.test(t.paciente?.email) ||
        regex.test(t.paciente?.phone)
      );
    } else {
      turnos = await Turno.find(query)
        .populate('paciente', 'name lastName email phone')
        .populate('profesional', 'name lastName')
        .sort({ fechaInicio: -1 })
        .limit(200);
    }

    // Calcular estadísticas
    const stats = {
      total: turnos.length,
      completados: turnos.filter((t: any) => t.estado === 'completado').length,
      confirmados: turnos.filter((t: any) => t.estado === 'confirmado').length,
      pendientes: turnos.filter((t: any) => t.estado === 'pendiente').length,
      cancelados: turnos.filter((t: any) => t.estado === 'cancelado').length,
      ausentes: turnos.filter((t: any) => t.estado === 'ausente').length,
    };

    return NextResponse.json({ success: true, turnos, stats });
  } catch (error) {
    console.error('Error GET /api/historial-turnos:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}