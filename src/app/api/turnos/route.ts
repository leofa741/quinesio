import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Turno from '@/app/models/Turno';
import User from '@/app/models/User';
import { sendAppointmentEmails } from '@/app/lib/email';


connectDB();

// ✅ GET: Obtener turnos para el calendario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const profesionalId = searchParams.get('profesionalId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const query: any = {};
    
    // Filtrar por profesional (obligatorio para la vista de agenda)
    if (profesionalId) query.profesional = profesionalId;
    // Si el usuario es profesional, solo puede ver sus propios turnos
    else if (session.user?.role === 'profesionales') {
      query.profesional = session.user.id;
    }

    // Filtrar por rango de fechas (para no cargar toda la BD)
    if (start && end) {
      query.fechaInicio = { $gte: new Date(start), $lte: new Date(end) };
    }

    const turnos = await Turno.find(query)
      .populate('paciente', 'name lastName email')
      .populate('profesional', 'name lastName email')
      .sort({ fechaInicio: 1 });

    // Formatear para FullCalendar
    const eventos = turnos.map(turno => {
      const pacienteName = `${turno.paciente.name} ${turno.paciente.lastName}`;
      let color = '#3b82f6'; // Azul (pendiente)
      
      if (turno.estado === 'confirmado') color = '#10b981'; // Verde
      if (turno.estado === 'cancelado') color = '#ef4444'; // Rojo
      if (turno.estado === 'completado') color = '#64748b'; // Gris

      return {
        id: turno._id.toString(),
        title: pacienteName,
        start: turno.fechaInicio,
        end: turno.fechaFin,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          estado: turno.estado,
          motivo: turno.motivoConsulta,
          notasInternas: turno.notasInternas || '',
          pacienteId: turno.paciente._id,
          profesionalId: turno.profesional._id,
        }
      };
    });

    return NextResponse.json({ success: true, eventos });
  } catch (error) {
    console.error('Error GET /api/turnos:', error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
  }
}

// ✅ POST: Crear turno (con cálculo automático de tiempo de preparación y anti-superposición)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos', 'profesionales', 'pacientes'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { pacienteId, profesionalId, fechaInicio, duracionMinutos, motivoConsulta, valorAcordado, moneda } = body;

    const [paciente, profesional] = await Promise.all([
      User.findById(pacienteId),
      User.findById(profesionalId)
    ]);

    if (!paciente || !profesional) {
      return NextResponse.json({ message: 'Paciente o profesional no encontrado' }, { status: 404 });
    }

    // 🕒 CÁLCULO AUTOMÁTICO DE FECHA FIN (Sesión + Tiempo de preparación)
    const start = new Date(fechaInicio);
    const tiempoPrep = profesional.tiempoPreparacionMinutos || 0;
    // Sumamos los minutos de la sesión + los minutos de preparación del profesional
    const end = new Date(start.getTime() + (duracionMinutos + tiempoPrep) * 60000);

    // 🛡️ Validación crítica: Evitar superposición usando la fecha 'end' calculada
    const turnoSuperpuesto = await Turno.findOne({
      profesional: profesionalId,
      estado: { $in: ['pendiente', 'confirmado'] },
      $or: [
        { fechaInicio: { $lt: end, $gte: start } },
        { fechaFin: { $gt: start, $lte: end } },
        { fechaInicio: { $lte: start }, fechaFin: { $gte: end } }
      ]
    });

    if (turnoSuperpuesto) {
      return NextResponse.json({ 
        message: `El profesional ya tiene un turno en ese horario (recuerda que tiene ${tiempoPrep} min de preparación entre sesiones).` 
      }, { status: 409 });
    }

    const nuevoTurno = await Turno.create({
      paciente: pacienteId,
      profesional: profesionalId,
      fechaInicio: start,
      fechaFin: end, // ✅ Guardamos la fecha de fin que incluye el tiempo de preparación
      duracionMinutos, // Guardamos la duración real de la sesión
      tiempoPreparacionMinutos: tiempoPrep, // Opcional: útil para reportes futuros
      estado: session.user?.role === 'pacientes' ? 'pendiente' : 'confirmado',
      motivoConsulta,
      valorAcordado: valorAcordado || profesional.honorarios?.valorSesion || 0,
      moneda: moneda || profesional.honorarios?.moneda || 'ARS',
      creadoPor: session.user.id
    });

    // 📧 Disparar emails (Fire and forget)
    const dateStr = start.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    sendAppointmentEmails({
      patientEmail: paciente.email,
      patientName: paciente.name,
      professionalEmail: profesional.email,
      professionalName: `${profesional.name} ${profesional.lastName}`,
      adminEmail: process.env.MAILER_ADMIN_LOG || '',
      dateStr,
      timeStr,
      motivo: motivoConsulta,
      status: nuevoTurno.estado,
      createdBy: session.user.name || 'Sistema'
    }).catch(err => console.error('Error en envío de emails:', err));

    return NextResponse.json({ success: true, turno: nuevoTurno }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/turnos:', error);
    return NextResponse.json({ message: 'Error interno al crear el turno' }, { status: 500 });
  }
}

// ✅ PATCH: Cambiar estado del turno o guardar notas internas
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'ID del turno es requerido' }, { status: 400 });
    }

    // 🛠️ Construir el objeto de actualización dinámicamente
    const updateData: any = {};
    if (body.estado) updateData.estado = body.estado;
    if (body.motivoCancelacion) updateData.motivoCancelacion = body.motivoCancelacion;
    if (body.notasInternas !== undefined) updateData.notasInternas = body.notasInternas;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No hay datos para actualizar' }, { status: 400 });
    }

    const turnoActualizado = await Turno.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('paciente', 'name lastName email').populate('profesional', 'name lastName email');

    if (!turnoActualizado) {
      return NextResponse.json({ message: 'Turno no encontrado' }, { status: 404 });
    }

    // 📧 ENVIAR EMAIL solo si el estado cambia a confirmado o cancelado
    if (body.estado === 'confirmado' || body.estado === 'cancelado') {
      const dateStr = new Date(turnoActualizado.fechaInicio).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      const timeStr = new Date(turnoActualizado.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      
      const patientName = `${turnoActualizado.paciente.name} ${turnoActualizado.paciente.lastName}`;
      const profName = `${turnoActualizado.profesional.name} ${turnoActualizado.profesional.lastName}`;
      const statusText = body.estado === 'confirmado' ? 'CONFIRMADO' : 'CANCELADO';

      await sendAppointmentEmails({
        patientEmail: turnoActualizado.paciente.email,
        patientName,
        professionalEmail: turnoActualizado.profesional.email,
        professionalName: profName,
        adminEmail: process.env.MAILER_ADMIN_LOG || '',
        dateStr,
        timeStr,
        motivo: turnoActualizado.motivoConsulta || '',
        status: statusText,
        createdBy: session.user.name || 'Sistema'
      }).catch(err => console.error('Error enviando email de actualización:', err));
    }

    return NextResponse.json({ success: true, turno: turnoActualizado });
  } catch (error) {
    console.error('Error PATCH /api/turnos:', error);
    return NextResponse.json({ message: 'Error al actualizar el turno' }, { status: 500 });
  }
}