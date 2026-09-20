import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Turno from '@/app/models/Turno';
import User from '@/app/models/User';
import { v2 as cloudinary } from 'cloudinary';
import { sendAppointmentEmails } from '@/app/lib/email';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDB();

// Función auxiliar para subir archivos a Cloudinary
async function uploadToCloudinary(file: File, folder: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: `kinesiologia/turnos/${folder}`,
    resource_type: 'auto'
  });
  return result.secure_url;
}

// ✅ GET: Obtener turnos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const profesionalId = searchParams.get('profesionalId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const query: any = {};
    if (profesionalId) query.profesional = profesionalId;
    else if (session.user?.role === 'profesionales') query.profesional = session.user.id;

    if (start && end) {
      query.fechaInicio = { $gte: new Date(start), $lte: new Date(end) };
    }

    const turnos = await Turno.find(query)
      .populate('paciente', 'name lastName email')
      .populate('profesional', 'name lastName email')
      .sort({ fechaInicio: 1 });

    const eventos = turnos.map(turno => {
      const pacienteName = `${turno.paciente.name} ${turno.paciente.lastName}`;
      let color = '#3b82f6';
      if (turno.estado === 'confirmado') color = '#10b981';
      if (turno.estado === 'cancelado') color = '#ef4444';
      if (turno.estado === 'completado') color = '#64748b';

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
          ordenMedicaUrl: turno.ordenMedicaUrl || '',
          dniFrenteUrl: turno.dniFrenteUrl || '',
          dniDorsoUrl: turno.dniDorsoUrl || '',
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

// ✅ POST: Crear turno (Soporta FormData para imágenes)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'administrativos', 'profesionales', 'pacientes'].includes(session.user?.role || '')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let pacienteId, profesionalId, fechaInicio, fechaFin, duracionMinutos, motivoConsulta, valorAcordado, moneda;
    let ordenMedicaUrl = '', dniFrenteUrl = '', dniDorsoUrl = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      pacienteId = formData.get('pacienteId') as string;
      profesionalId = formData.get('profesionalId') as string;
      fechaInicio = formData.get('fechaInicio') as string;
      fechaFin = formData.get('fechaFin') as string;
      duracionMinutos = parseInt(formData.get('duracionMinutos') as string);
      motivoConsulta = formData.get('motivoConsulta') as string;
      valorAcordado = formData.get('valorAcordado') ? parseFloat(formData.get('valorAcordado') as string) : undefined;
      moneda = formData.get('moneda') as string;

      const ordenFile = formData.get('ordenMedica') as File;
      const dniFrenteFile = formData.get('dniFrente') as File;
      const dniDorsoFile = formData.get('dniDorso') as File;

      if (ordenFile && ordenFile.size > 0) ordenMedicaUrl = await uploadToCloudinary(ordenFile, 'ordenes');
      if (dniFrenteFile && dniFrenteFile.size > 0) dniFrenteUrl = await uploadToCloudinary(dniFrenteFile, 'dnis');
      if (dniDorsoFile && dniDorsoFile.size > 0) dniDorsoUrl = await uploadToCloudinary(dniDorsoFile, 'dnis');
    } else {
      const body = await req.json();
      ({ pacienteId, profesionalId, fechaInicio, fechaFin, duracionMinutos, motivoConsulta, valorAcordado, moneda } = body);
    }

    const [paciente, profesional] = await Promise.all([
      User.findById(pacienteId),
      User.findById(profesionalId)
    ]);

    if (!paciente || !profesional) {
      return NextResponse.json({ message: 'Paciente o profesional no encontrado' }, { status: 404 });
    }

    const start = new Date(fechaInicio);
    const tiempoPrep = profesional.tiempoPreparacionMinutos || 0;
    const end = new Date(start.getTime() + (duracionMinutos + tiempoPrep) * 60000);

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
      return NextResponse.json({ message: 'El profesional ya tiene un turno en ese horario.' }, { status: 409 });
    }

    const nuevoTurno = await Turno.create({
      paciente: pacienteId,
      profesional: profesionalId,
      fechaInicio: start,
      fechaFin: end,
      duracionMinutos,
      estado: session.user?.role === 'pacientes' ? 'pendiente' : 'confirmado',
      motivoConsulta,
      ordenMedicaUrl,
      dniFrenteUrl,
      dniDorsoUrl,
      valorAcordado: valorAcordado || profesional.honorarios?.valorSesion || 0,
      moneda: moneda || profesional.honorarios?.moneda || 'ARS',
      creadoPor: session.user.id
    });

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

// ✅ PATCH: Actualizar turno (Soporta FormData para imágenes y notas)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID es requerido' }, { status: 400 });

    const contentType = req.headers.get('content-type') || '';
    const updateData: any = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      if (formData.has('estado')) updateData.estado = formData.get('estado');
      if (formData.has('motivoCancelacion')) updateData.motivoCancelacion = formData.get('motivoCancelacion');
      if (formData.has('notasInternas')) updateData.notasInternas = formData.get('notasInternas');

      const ordenFile = formData.get('ordenMedica') as File;
      const dniFrenteFile = formData.get('dniFrente') as File;
      const dniDorsoFile = formData.get('dniDorso') as File;

      if (ordenFile && ordenFile.size > 0) updateData.ordenMedicaUrl = await uploadToCloudinary(ordenFile, 'ordenes');
      if (dniFrenteFile && dniFrenteFile.size > 0) updateData.dniFrenteUrl = await uploadToCloudinary(dniFrenteFile, 'dnis');
      if (dniDorsoFile && dniDorsoFile.size > 0) updateData.dniDorsoUrl = await uploadToCloudinary(dniDorsoFile, 'dnis');
      
      // Permitir borrar imágenes si se envía un string vacío explícitamente
      if (formData.get('deleteOrden') === 'true') updateData.ordenMedicaUrl = null;
      if (formData.get('deleteDniFrente') === 'true') updateData.dniFrenteUrl = null;
      if (formData.get('deleteDniDorso') === 'true') updateData.dniDorsoUrl = null;

    } else {
      const body = await req.json();
      if (body.estado) updateData.estado = body.estado;
      if (body.motivoCancelacion) updateData.motivoCancelacion = body.motivoCancelacion;
      if (body.notasInternas !== undefined) updateData.notasInternas = body.notasInternas;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No hay datos para actualizar' }, { status: 400 });
    }

    const turnoActualizado = await Turno.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('paciente', 'name lastName email')
      .populate('profesional', 'name lastName email');

    if (!turnoActualizado) return NextResponse.json({ message: 'Turno no encontrado' }, { status: 404 });

    if (updateData.estado === 'confirmado' || updateData.estado === 'cancelado') {
      const dateStr = new Date(turnoActualizado.fechaInicio).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      const timeStr = new Date(turnoActualizado.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      
      await sendAppointmentEmails({
        patientEmail: turnoActualizado.paciente.email,
        patientName: `${turnoActualizado.paciente.name} ${turnoActualizado.paciente.lastName}`,
        professionalEmail: turnoActualizado.profesional.email,
        professionalName: `${turnoActualizado.profesional.name} ${turnoActualizado.profesional.lastName}`,
        adminEmail: process.env.MAILER_ADMIN_LOG || '',
        dateStr,
        timeStr,
        motivo: turnoActualizado.motivoConsulta || '',
        status: updateData.estado === 'confirmado' ? 'CONFIRMADO' : 'CANCELADO',
        createdBy: session.user.name || 'Sistema'
      }).catch(err => console.error('Error enviando email:', err));
    }

    return NextResponse.json({ success: true, turno: turnoActualizado });
  } catch (error) {
    console.error('Error PATCH /api/turnos:', error);
    return NextResponse.json({ message: 'Error al actualizar el turno' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar turno
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Solo administradores pueden eliminar' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    await Turno.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Turno eliminado' });
  } catch (error) {
    console.error('Error DELETE /api/turnos:', error);
    return NextResponse.json({ message: 'Error al eliminar' }, { status: 500 });
  }
}