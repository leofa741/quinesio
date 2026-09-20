import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import Turno from '@/app/models/Turno';
import User from '@/app/models/User';

connectDB();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profesionalId = searchParams.get('profesionalId');
    const fecha = searchParams.get('fecha'); // Formato YYYY-MM-DD

    if (!profesionalId || !fecha) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const profesional = await User.findById(profesionalId);
    if (!profesional) {
      return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 404 });
    }

    // Duración de la sesión + tiempo de preparación del profesional
    const duracionSesion = profesional.honorarios?.duracionSesion || 60;
    const tiempoPrep = profesional.tiempoPreparacionMinutos || 0;
    const tiempoTotalSlot = duracionSesion + tiempoPrep;

    // Horarios base que ofrecemos (puedes ajustar esto según la realidad del centro)
    const baseSlots = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00'];
    
    // Rango del día para la consulta a la BD
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar turnos ya agendados (pendientes o confirmados) para ese profesional en ese día
    const turnosOcupados = await Turno.find({
      profesional: profesionalId,
      fechaInicio: { $gte: startOfDay, $lte: endOfDay },
      estado: { $in: ['pendiente', 'confirmado'] }
    });

    const slotsDisponibles = [];

    // Evaluar cada horario base
    for (const slot of baseSlots) {
      const [h, m] = slot.split(':').map(Number);
      
      // Crear fechas de inicio y fin para este slot hipotético
      const slotStart = new Date(fecha);
      slotStart.setHours(h, m, 0, 0);
      
      const slotEnd = new Date(slotStart.getTime() + tiempoTotalSlot * 60000);

      // Verificar si este slot se superpone con algún turno existente
      const haySuperposicion = turnosOcupados.some(turno => {
        const tStart = new Date(turno.fechaInicio);
        const tEnd = new Date(turno.fechaFin);
        // Lógica de superposición de rangos de tiempo
        return (slotStart < tEnd && slotEnd > tStart);
      });

      // Si no hay superposición, el horario está libre
      if (!haySuperposicion) {
        slotsDisponibles.push(slot);
      }
    }

    return NextResponse.json({ success: true, slots: slotsDisponibles });

  } catch (error) {
    console.error('Error calculando disponibilidad:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}