// app/api/send-mail/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────────────────
// 🔹 TIPOS PARA EL FORMULARIO DE CONTACTO (CENTRO KINESIOLÓGICO)
// ─────────────────────────────────────────────────────────────
interface ContactForm {
  name: string;
  contact: string; // Puede ser email o teléfono
  interest: 'general' | 'turno' | 'cobertura' | 'rehabilitacion' | 'domiciliaria' | 'deportiva' | 'asesoramiento';
  message: string;
  subject?: string;
}

// ─────────────────────────────────────────────────────────────
// 🔹 MAPEOS LEGIBLES PARA EL EMAIL (Contexto Kinesiológico)
// ─────────────────────────────────────────────────────────────
const interestLabels: Record<string, string> = {
  general: 'Consulta general',
  turno: 'Solicitar turno',
  cobertura: 'Obras sociales y coberturas',
  rehabilitacion: 'Rehabilitación y tratamientos',
  domiciliaria: 'Atención domiciliaria',
  deportiva: 'Kinesiología deportiva',
  asesoramiento: 'Asesoramiento profesional',
};

const interestIcons: Record<string, string> = {
  general: '💬',
  turno: '📅',
  cobertura: '🏥',
  rehabilitacion: '🩺',
  domiciliaria: '🏠',
  deportiva: '⚽',
  asesoramiento: '👨‍⚕️',
};

// ─────────────────────────────────────────────────────────────
// 🔹 HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body: ContactForm = await req.json();
    const { name, contact, interest, message } = body;

    // ✅ Validación de campos obligatorios
    if (!name?.trim() || !contact?.trim() || !message?.trim() || !interest) {
      return NextResponse.json(
        { success: false, message: 'Por favor, completá los campos obligatorios.' },
        { status: 400 }
      );
    }

    // Configuración de Nodemailer
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

    // Verificar conexión
    await transporter.verify();

    // Construir contenido del email
    const emailContent = buildEmailContent(body);

    const mailOptions = {
      from: `"Centro Kinesiológico" <${process.env.MAILER_EMAIL}>`,
      to: process.env.MAILER_EMAIL,
      cc: process.env.MAILER_CC ? process.env.MAILER_CC.split(',').map((e: string) => e.trim()) : undefined,
      subject: `🏥 Nueva consulta: ${interestLabels[interest]} - ${name}`,
      html: emailContent,
      text: buildTextContent(body),
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Email enviado: ${interest} - ${contact}`);

    return NextResponse.json({ 
      success: true, 
      message: '¡Mensaje enviado! Te responderemos a la brevedad.' 
    });

  } catch (error) {
    console.error('❌ Error al enviar el correo:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ocurrió un error al enviar tu consulta. Por favor, intentá de nuevo o contactanos por WhatsApp.' 
      },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 🔹 PLANTILLA HTML PREMIUM PARA EL EMAIL (Diseño Clínico)
// ─────────────────────────────────────────────────────────────
function buildEmailContent(data: ContactForm): string {
  const { name, contact, interest, message } = data;
  const icon = interestIcons[interest] || '📩';
  
  const styles = {
    container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background: #f1f5f9;',
    wrapper: 'padding: 24px 16px;',
    header: 'background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 24px; text-align: center; border-radius: 16px 16px 0 0; position: relative; overflow: hidden;',
    headerOverlay: 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);',
    headerIcon: 'display: inline-block; background: rgba(255,255,255,0.2); width: 64px; height: 64px; border-radius: 50%; line-height: 64px; font-size: 32px; margin-bottom: 16px;',
    headerTitle: 'color: white; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.02em;',
    headerSubtitle: 'color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; font-weight: 400;',
    body: 'background: white; padding: 32px 28px; border-radius: 0 0 16px 16px; box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.1);',
    alertBanner: 'background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;',
    alertText: 'color: #0369a1; font-size: 13px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;',
    card: 'background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e2e8f0;',
    cardHeader: 'color: #0ea5e9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0; font-weight: 700;',
    label: 'color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px 0; font-weight: 600;',
    value: 'color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;',
    valueLast: 'color: #0f172a; font-size: 16px; font-weight: 600; margin: 0;',
    messageBox: 'background: #f0f9ff; padding: 20px; border-radius: 10px; border: 1px solid #bae6fd; margin: 20px 0;',
    messageLabel: 'color: #0369a1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px 0; font-weight: 700;',
    messageText: 'color: #334155; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;',
    footer: 'text-align: center; padding: 28px 24px; color: #64748b; font-size: 12px; background: white; border-top: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;',
    footerBrand: 'color: #0f172a; font-size: 14px; font-weight: 700; margin: 0 0 12px 0;',
    footerInfo: 'color: #64748b; font-size: 12px; margin: 4px 0;',
    badge: 'display: inline-block; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 8px 18px; border-radius: 24px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);',
    button: 'display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); margin-top: 8px;',
    divider: 'height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 24px 0;',
    infoRow: 'display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;',
    infoRowLast: 'display: flex; justify-content: space-between; align-items: center; padding: 12px 0;',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva consulta - Centro Kinesiológico</title>
    </head>
    <body style="margin: 0; padding: 0; background: #f1f5f9;">
      
      <div style="${styles.container}">
        <div style="${styles.wrapper}">
          
          <!-- HEADER -->
          <div style="${styles.header}">
            <div style="${styles.headerOverlay}"></div>
            <div style="position: relative; z-index: 1;">
              <div style="${styles.headerIcon}">🏥</div>
              <h1 style="${styles.headerTitle}">Nueva Consulta</h1>
              <p style="${styles.headerSubtitle}">Centro Kinesiológico</p>
            </div>
          </div>

          <!-- BODY -->
          <div style="${styles.body}">
            
            <!-- Alert Banner -->
            <div style="${styles.alertBanner}">
              <span style="font-size: 20px;">${icon}</span>
              <p style="${styles.alertText}">Consulta de: ${interestLabels[interest] || interest}</p>
            </div>

            <!-- Datos del Paciente -->
            <div style="${styles.card}">
              <p style="${styles.cardHeader}">Datos del Paciente</p>
              
              <div style="${styles.infoRow}">
                <p style="${styles.label}">Nombre completo</p>
                <p style="color: #0f172a; font-size: 15px; font-weight: 600; margin: 0;">${name}</p>
              </div>
              
              <div style="${styles.infoRowLast}">
                <p style="${styles.label}">Contacto</p>
                <p style="color: #0f172a; font-size: 15px; font-weight: 600; margin: 0;">${contact}</p>
              </div>
            </div>

            <!-- Mensaje -->
            <div style="${styles.messageBox}">
              <p style="${styles.messageLabel}">📝 Mensaje del Paciente</p>
              <p style="${styles.messageText}">${message.replace(/\n/g, '<br>')}</p>
            </div>

            <!-- Info adicional -->
            <div style="background: #f8fafc; padding: 16px 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0;">
                <strong style="color: #0f172a;">Tipo de consulta:</strong> ${icon} ${interestLabels[interest] || interest}<br>
                <strong style="color: #0f172a;">Fecha de recepción:</strong> ${new Date().toLocaleString('es-AR', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}
              </p>
            </div>

            <div style="${styles.divider}"></div>

            <!-- Botón Responder -->
            <div style="text-align: center; margin-top: 8px;">
              ${contact.includes('@') ? `
                <a href="mailto:${contact}?subject=Re: Consulta Centro Kinesiológico - ${name}" 
                   style="${styles.button}">
                  ✉️ Responder a ${name}
                </a>
              ` : `
                <a href="tel:${contact.replace(/\D/g, '')}" 
                   style="${styles.button}">
                  📞 Llamar a ${name}
                </a>
              `}
            </div>

          </div>

          <!-- FOOTER -->
          <div style="${styles.footer}">
            <p style="${styles.footerBrand}">🏥 Centro Kinesiológico</p>
            <p style="${styles.footerInfo}">📧 ${process.env.MAILER_EMAIL}</p>
            <p style="${styles.footerInfo}">Este mensaje fue enviado desde el formulario de contacto oficial.</p>
            <p style="${styles.footerInfo}; color: #94a3b8; font-size: 11px; margin-top: 12px;">
              © ${new Date().getFullYear()} Todos los derechos reservados
            </p>
          </div>

        </div>
      </div>

    </body>
    </html>
  `;
}

// ─────────────────────────────────────────────────────────────
// 🔹 VERSIÓN TEXTO PLANO (FALLBACK)
// ─────────────────────────────────────────────────────────────
function buildTextContent(data: ContactForm): string {
  const { name, contact, interest, message } = data;
  
  return `
NUEVA CONSULTA - CENTRO KINESIOLÓGICO
========================================================

${interestIcons[interest] || '📩'} TIPO DE CONSULTA: ${interestLabels[interest] || interest}

DATOS DEL PACIENTE:
• Nombre: ${name}
• Contacto: ${contact}

MENSAJE:
${message}

--------------------------------------------------------
Recibido: ${new Date().toLocaleString('es-AR')}
Responder a: ${contact}
Enviado desde: Formulario web - Centro Kinesiológico
  `.trim();
}