import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectDB from '@/app/lib/mongoose';
import Notificacion from '@/app/models/Notificacion';
import User from '@/app/models/User';

// Configuración de Nodemailer (la misma que ya tienes)
const transporter = nodemailer.createTransport({
  service: process.env.MAILER_SERVICE || 'gmail',
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: process.env.MAILER_SECRET_KEY,
  },
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Datos del turno que se liberó (vendrían del frontend del admin)
    const { profesionalNombre, diaSemana, fechaTurno } = body;

    // 1. BUSCAR en la base de datos a los pacientes interesados
    const alertasInteresadas = await Notificacion.find({
      tipo: 'turno_libre',
      'profesional.nombre': profesionalNombre,
      diasPreferidos: diaSemana, // Ej: 'Martes'
      activo: true,
      canal: { $in: ['email', 'ambos'] } // Solo los que quieren email
    }).populate('usuario'); // Esto trae los datos del usuario (email, nombre)

    if (alertasInteresadas.length === 0) {
      return NextResponse.json({ message: 'Nadie tiene alertas para este turno' });
    }

    // 2. ENVIAR los correos en bucle
    const resultados = [];
    for (const alerta of alertasInteresadas) {
      const paciente = alerta.usuario;
      
      try {
        await transporter.sendMail({
          from: `"Centro de Kinesiología" <${process.env.MAILER_EMAIL}>`,
          to: paciente.email,
          subject: `🔔 ¡Se liberó un turno con ${profesionalNombre}!`,
          html: `
            <h2 style="color: #0284c7;">¡Hola ${paciente.name}!</h2>
            <p>Como lo solicitaste, te avisamos que se ha liberado un turno:</p>
            <ul>
              <li><strong>Profesional:</strong> ${profesionalNombre}</li>
              <li><strong>Día:</strong> ${diaSemana}</li>
              <li><strong>Fecha disponible:</strong> ${fechaTurno}</li>
            </ul>
            <br/>
            <a href="https://tu-sitio.com/turnos/reservar" 
               style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Reservar este turno ahora
            </a>
            <p style="font-size: 12px; color: gray; margin-top: 20px;">
              Si ya no te interesa, puedes pausar esta alerta en tu perfil.
            </p>
          `,
        });
        resultados.push({ email: paciente.email, status: 'Enviado' });
      } catch (error) {
        console.error(`Error enviando a ${paciente.email}:`, error);
        resultados.push({ email: paciente.email, status: 'Fallido' });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Notificaciones enviadas a ${resultados.length} pacientes`,
      detalles: resultados 
    });

  } catch (error) {
    console.error('Error en notificación masiva:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}