import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import nodemailer from 'nodemailer';
import connectDB from '@/app/lib/mongoose';
import Turno from '@/app/models/Turno';

connectDB();

export async function GET(req: NextRequest) {
  try {
    // 1. Verificar autorización: O es el Cron Job, O es un usuario logueado con permisos
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get('authorization');
    
    const isCronJob = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isAuthorizedUser = session && ['admin', 'profesionales', 'administrativos'].includes(session.user?.role || '');

    if (!isCronJob && !isAuthorizedUser) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // Buscar turnos de las próximas 24 horas que estén confirmados y sin recordatorio enviado
    const ahora = new Date();
    const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    const turnosProximos = await Turno.find({
      fechaInicio: { $gte: ahora, $lte: en24Horas },
      estado: 'confirmado',
      recordatorioEnviado: false
    })
    .populate('paciente', 'name email')
    .populate('profesional', 'name lastName');

    if (turnosProximos.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay recordatorios pendientes', enviados: 0 });
    }

    // Configuración de Nodemailer (la misma que ya usas)
    const transporter = nodemailer.createTransport({
      service: process.env.MAILER_SERVICE || 'gmail',
      host: process.env.MAILER_HOST,
      port: parseInt(process.env.MAILER_PORT || '587'),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_SECRET_KEY,
      },
    });

    let enviados = 0;
    const errores: string[] = [];

    for (const turno of turnosProximos) {
      try {
        const paciente = turno.paciente as any;
        const profesional = turno.profesional as any;

        if (!paciente?.email) {
          errores.push(`Paciente ID ${turno.paciente} no tiene email registrado`);
          // Marcamos como enviado para no seguir intentando con este turno sin email
          await Turno.findByIdAndUpdate(turno._id, { recordatorioEnviado: true });
          continue;
        }

        const fechaFormateada = new Date(turno.fechaInicio).toLocaleDateString('es-AR', {
          weekday: 'long', day: 'numeric', month: 'long'
        });
        const horaFormateada = new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {
          hour: '2-digit', minute: '2-digit'
        });

        const mailOptions = {
          from: `"Centro Kinesiológico" <${process.env.MAILER_EMAIL}>`,
          to: paciente.email,
          subject: `📅 Recordatorio: Tu turno mañana a las ${horaFormateada}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #334155; background: #f1f5f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.1); }
                .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .content { padding: 32px 28px; }
                .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .info-box p { margin: 8px 0; font-size: 15px; }
                .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📅 Recordatorio de Turno</h1>
                </div>
                <div class="content">
                  <p>Hola <strong>${paciente.name}</strong>,</p>
                  <p>Te escribimos para recordarte que tienes un turno programado para <strong>mañana</strong>:</p>
                  
                  <div class="info-box">
                    <p><strong>📆 Fecha:</strong> ${fechaFormateada}</p>
                    <p><strong>🕐 Hora:</strong> ${horaFormateada} hs</p>
                    <p><strong>👨‍⚕️ Profesional:</strong> ${profesional.name} ${profesional.lastName}</p>
                    ${turno.motivoConsulta ? `<p><strong>📋 Motivo:</strong> ${turno.motivoConsulta}</p>` : ''}
                  </div>

                  <p>Si por algún motivo no puedes asistir, te agradecemos que nos avises con al menos 24 horas de anticipación para poder reprogramar o liberar el turno a otro paciente.</p>
                  
                  <p style="margin-top: 24px;">¡Te esperamos!</p>
                </div>
                <div class="footer">
                  <p>Centro Kinesiológico © ${new Date().getFullYear()}</p>
                  <p>Este es un mensaje automático, por favor no responder a este correo.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await transporter.sendMail(mailOptions);

        // Marcar como enviado para no duplicar
        await Turno.findByIdAndUpdate(turno._id, { recordatorioEnviado: true });
        enviados++;

      } catch (error) {
        console.error(`Error enviando a ${turno.paciente}:`, error);
        errores.push(`Error con ${turno.paciente}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Proceso completado. Enviados: ${enviados}`,
      enviados,
      total: turnosProximos.length,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('Error en API de recordatorios:', error);
    return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
  }
}