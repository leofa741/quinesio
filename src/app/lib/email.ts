import nodemailer from 'nodemailer';

// 1. Configuración única del transporter (se reutiliza en toda la app)
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

// 2. Función genérica de envío
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    await transporter.sendMail({
      from: `"Centro de Kinesiología" <${process.env.MAILER_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email enviado a: ${to}`);
  } catch (error) {
    console.error(`❌ Error enviando email a ${to}:`, error);
    // No lanzamos error para no romper el flujo de creación de turnos si el email falla
  }
}

// 3. Plantillas específicas para el sistema de salud
export const EmailTemplates = {

  // Agrega esto al objeto EmailTemplates
  cancellationNotification: (patientName: string, profName: string, date: string, time: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #dc2626;">Turno Cancelado</h2>
    <p>Hola ${patientName}, tu turno ha sido cancelado:</p>
    <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 5px 0;"><strong>Profesional:</strong> ${profName}</p>
      <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
      <p style="margin: 5px 0;"><strong>Hora:</strong> ${time}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">Puedes reservar un nuevo turno desde tu panel.</p>
  </div>
`,
  // Para el Paciente
  patientConfirmation: (patientName: string, profName: string, date: string, time: string, status: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7;">Hola ${patientName},</h2>
      <p>Tu solicitud de turno ha sido <strong>${status.toUpperCase()}</strong>.</p>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Profesional:</strong> ${profName}</p>
        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Hora:</strong> ${time}</p>
      </div>
      <p style="color: #64748b; font-size: 14px;">Pronto recibirás una confirmación definitiva o te contactaremos si necesitamos ajustar algún detalle.</p>
    </div>
  `,

  // Para el Profesional
  professionalNotification: (profName: string, patientName: string, date: string, time: string, motivo: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7;">Nuevo Turno Asignado</h2>
      <p>Hola ${profName}, se ha agendado un nuevo turno en tu agenda:</p>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Paciente:</strong> ${patientName}</p>
        <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${date} a las ${time}</p>
        <p style="margin: 5px 0;"><strong>Motivo:</strong> ${motivo || 'No especificado'}</p>
      </div>
      <p style="color: #64748b; font-size: 14px;">Puedes revisar los detalles completos en tu panel de gestión.</p>
    </div>
  `,

  // Para el Administrativo (Registro interno)
  adminLog: (patientName: string, profName: string, date: string, time: string, createdBy: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="color: #475569;">📋 Registro de Nuevo Turno</h3>
      <p><strong>Paciente:</strong> ${patientName}</p>
      <p><strong>Profesional:</strong> ${profName}</p>
      <p><strong>Fecha/Hora:</strong> ${date} - ${time}</p>
      <p><strong>Agendado por:</strong> ${createdBy}</p>
    </div>
  `
};

// 4. Función maestra que orquesta los envíos
export async function sendAppointmentEmails({
  patientEmail, patientName,
  professionalEmail, professionalName,
  adminEmail,
  dateStr, timeStr, motivo, status, createdBy
}: {
  patientEmail: string; patientName: string;
  professionalEmail: string; professionalName: string;
  adminEmail: string;
  dateStr: string; timeStr: string; motivo: string; status: string; createdBy: string;
}) {
  // 1. Email al paciente
  if (patientEmail) {
    await sendEmail({
      to: patientEmail,
      subject: `Estado de tu turno con ${professionalName}`,
      html: EmailTemplates.patientConfirmation(patientName, professionalName, dateStr, timeStr, status)
    });
  }

  // 2. Email al profesional
  if (professionalEmail) {
    await sendEmail({
      to: professionalEmail,
      subject: `Nuevo turno agendado: ${patientName}`,
      html: EmailTemplates.professionalNotification(professionalName, patientName, dateStr, timeStr, motivo)
    });
  }

  // 3. Email al administrativo (opcional, o para registro)
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `[REGISTRO] Nuevo turno: ${patientName} con ${professionalName}`,
      html: EmailTemplates.adminLog(patientName, professionalName, dateStr, timeStr, createdBy)
    });
  }
}