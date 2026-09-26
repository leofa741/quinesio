import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import mongoose from 'mongoose';
import Turno from '@/app/models/Turno'; 

connectDB();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Incluimos 'confirmado' y 'pendiente' para asegurar que traiga datos de prueba
    const query: any = { 
      estado: { $in: ['completado', 'finalizado', 'atendido', 'confirmado', 'pendiente'] } 
    };
    
    if (userRole === 'profesionales') {
      query.profesional = new mongoose.Types.ObjectId(userId); 
    }

    const turnosReales = await Turno.find(query)
      // Pedimos varios campos de nombre comunes por si tu modelo usa 'name', 'nombre' o 'firstName'
      .populate('paciente', 'nombre apellido name firstName lastName email') 
      .populate('profesional', 'nombre name firstName lastName email')
      .sort({ fechaInicio: -1 })
      .limit(50)
      .lean();

    console.log(`✅ Turnos encontrados: ${turnosReales.length}`);

    const turnosFormateados = turnosReales.map((turno: any) => {
      // 🛡️ BLINDAJE: Verificamos que NO sea null y que sea un objeto
      const pac = turno.paciente;
      const nombrePaciente = (pac && typeof pac === 'object' && pac !== null)
        ? (pac.nombre || pac.name || pac.firstName || pac.apellido || 'Paciente')
        : 'Paciente (No vinculado)';
        
      const prof = turno.profesional;
      const nombreProfesional = (prof && typeof prof === 'object' && prof !== null)
        ? (prof.nombre || prof.name || prof.firstName || 'Profesional')
        : 'Profesional (No vinculado)';

      return {
        _id: turno._id.toString(),
        profesionalId: (prof && typeof prof === 'object' && prof !== null) ? prof._id.toString() : (turno.profesional ? turno.profesional.toString() : ''),
        profesionalNombre: nombreProfesional,
        pacienteNombre: nombrePaciente,
        fecha: turno.fechaInicio,
        duracionMinutos: turno.duracionMinutos || 60,
        especialidad: turno.especialidad || turno.motivoConsulta || 'Sesión Kinesiológica',
      };
    });

    return NextResponse.json(turnosFormateados);
  } catch (error) {
    console.error('❌ Error al obtener turnos completados:', error);
    return NextResponse.json({ message: 'Error al obtener turnos' }, { status: 500 });
  }
}