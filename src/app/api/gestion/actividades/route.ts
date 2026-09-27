import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import Actividad from '@/app/models/Actividad';
import Turno from '@/app/models/Turno';
// ⚠️ IMPORTANTE: Asegúrate de que esta ruta apunte a tu modelo de Usuario/Profesional real.
// Si tu modelo se llama 'Profesional' en lugar de 'User', cambia '@/app/models/User' por '@/app/models/Profesional'
import User from '@/app/models/User'; 
import connectDB from '@/app/lib/mongoose';

connectDB();

// ✅ GET - Obtener todas las actividades (Se mantiene igual, está perfecto)
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

// ✅ POST - Registrar actividad Y ACTUALIZAR AUTOMÁTICAMENTE LOS PAGOS DEL TURNO
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['admin', 'profesionales', 'administrativos'].includes(userRole)) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const { turnoId, profesionalId, profesionalNombre, pacienteNombre, fecha, duracionMinutos, tipoSesion, notas } = body;

    if (!profesionalId || !pacienteNombre || !fecha || !duracionMinutos || !tipoSesion) {
      return NextResponse.json({ message: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1️⃣ Paso 1: Crear el registro de la Actividad (Tu código original)
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

    // 2️⃣ Paso 2: 🔄 MAGIA - Actualización automática de pagos en el Turno vinculado
    if (turnoId) {
      try {
        // Buscamos el turno y traemos los datos del profesional para leer sus honorarios
        const turnoActual = await Turno.findById(turnoId).populate('profesional');
        
        if (turnoActual) {
          // A. Calculamos el Monto Total: Usamos el 'valorAcordado' del turno, o si es 0, el honorario actual del profesional
          const valorSesionProf = turnoActual.profesional?.honorarios?.valorSesion || 0;
          const montoTotal = turnoActual.valorAcordado > 0 ? turnoActual.valorAcordado : valorSesionProf;
          
          // B. Calculamos el Monto del Profesional: Usamos su valor de sesión, o si no tiene, un 70% del total (puedes ajustar este %)
          const montoProfesional = valorSesionProf > 0 ? valorSesionProf : Math.round(montoTotal * 0.70);

          // C. Actualizamos el Turno con la información financiera y lo marcamos como completado
          await Turno.findByIdAndUpdate(turnoId, {
            montoTotal: montoTotal,
            montoProfesional: montoProfesional,
            estadoPagoPaciente: 'pendiente',      // Queda listo para cobrar en la página de Pagos
            estadoPagoProfesional: 'pendiente',   // Queda listo para liquidar en la página de Pagos
            estado: 'completado',                 // ¡Cambia el estado del turno a completado!
            observacionesPago: notas || turnoActual.observacionesPago // Guarda las notas clínicas como observación de pago
          });
          
          console.log(`✅ Turno ${turnoId} actualizado automáticamente con datos de pago.`);
        }
      } catch (error) {
        // Si falla la actualización del turno, NO fallamos la creación de la actividad.
        // Solo lo registramos en consola para que puedas revisarlo.
        console.error('⚠️ Error al actualizar los datos de pago del turno vinculado:', error);
      }
    }

    return NextResponse.json(nuevaActividad, { status: 201 });
  } catch (error) {
    console.error('Error en POST actividad:', error);
    return NextResponse.json({ message: 'Error al registrar la actividad' }, { status: 500 });
  }
}