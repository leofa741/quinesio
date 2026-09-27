import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import Actividad from '@/app/models/Actividad';
import Turno from '@/app/models/Turno';
import User from '@/app/models/User'; // Ajusta si tu modelo se llama Profesional
import connectDB from '@/app/lib/mongoose';

connectDB();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['admin', 'profesionales', 'administrativos'].includes(userRole)) {
      return NextResponse.json({ message: 'Acceso no autorizado' }, { status: 403 });
    }

    const query: any = {};
    if (userRole === 'profesionales') {
      query.profesionalId = (session.user as any).id; 
    }

    const actividades = await Actividad.find(query).sort({ fecha: -1 }).lean();
    return NextResponse.json(actividades);
  } catch (error) {
    console.error('Error en GET actividades:', error);
    return NextResponse.json({ message: 'Error al obtener actividades' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['admin', 'profesionales', 'administrativos'].includes(userRole)) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    // ✅ Ahora recibimos montoTotal y montoProfesional del formulario
    const { turnoId, profesionalId, profesionalNombre, pacienteNombre, fecha, duracionMinutos, tipoSesion, notas, montoTotal, montoProfesional } = body;

    if (!profesionalId || !pacienteNombre || !fecha || !duracionMinutos || !tipoSesion) {
      return NextResponse.json({ message: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const nuevaActividad = await Actividad.create({
      turnoId: turnoId || null,
      profesionalId,
      profesionalNombre,
      pacienteNombre,
      fecha: new Date(fecha),
      duracionMinutos: Number(duracionMinutos),
      tipoSesion,
      notas: notas || '',
      estado: 'Completada',
    });

    if (turnoId) {
      try {
        const turnoActual = await Turno.findById(turnoId).populate('profesional');
        
        if (turnoActual) {
          // Usamos los montos del formulario. Si vienen en 0 o undefined, intentamos calcularlos
          const finalMontoTotal = Number(montoTotal) > 0 ? Number(montoTotal) : (turnoActual.valorAcordado || turnoActual.profesional?.honorarios?.valorSesion || 0);
          
          const finalMontoProfesional = Number(montoProfesional) > 0 ? Number(montoProfesional) : (turnoActual.profesional?.honorarios?.valorSesion || Math.round(finalMontoTotal * 0.70));

          await Turno.findByIdAndUpdate(turnoId, {
            montoTotal: finalMontoTotal,
            montoProfesional: finalMontoProfesional,
            estadoPagoPaciente: 'pendiente',
            estadoPagoProfesional: 'pendiente',
            estado: 'completado',
            observacionesPago: notas || turnoActual.observacionesPago
          });
          
          console.log(`✅ Turno ${turnoId} actualizado. Total: $${finalMontoTotal}, Prof: $${finalMontoProfesional}`);
        }
      } catch (error) {
        console.error('⚠️ Error al actualizar datos de pago del turno:', error);
      }
    }

    return NextResponse.json(nuevaActividad, { status: 201 });
  } catch (error) {
    console.error('Error en POST actividad:', error);
    return NextResponse.json({ message: 'Error al registrar la actividad' }, { status: 500 });
  }
}