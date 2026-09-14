// app/api/send-mail/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────────────────
// 🔹 TIPOS PARA EL FORMULARIO DE INDUMENTARIA (SG TU LOOK)
// ─────────────────────────────────────────────────────────────
interface ContactForm {
  name: string;
  contact: string; // Puede ser email o teléfono
  interest: 'general' | 'talle' | 'stock' | 'asesoramiento' | 'mayorista';
  message: string;
  subject?: string;
}

// ─────────────────────────────────────────────────────────────
// 🔹 MAPEOS LEGIBLES PARA EL EMAIL
// ─────────────────────────────────────────────────────────────
const interestLabels: Record<string, string> = {
  general: 'Consulta general',
  talle: 'Dudas sobre talles y medidas',
  stock: 'Consultar stock de una prenda',
  asesoramiento: 'Asesoramiento de imagen personalizado',
  mayorista: 'Compras mayoristas',
};

// ─────────────────────────────────────────────────────────────
// 🔹 HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body: ContactForm = await req.json();
    const { name, contact, interest, message } = body;

    // ✅ Validación de campos obligatorios (ahora usa 'contact' en lugar de 'email')
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
      from: `"SG Tu Look" <${process.env.MAILER_EMAIL}>`,
      to: process.env.MAILER_EMAIL,
      cc: process.env.MAILER_CC ? process.env.MAILER_CC.split(',').map((e: string) => e.trim()) : undefined,
      subject: `✨ Nueva consulta: ${interestLabels[interest]} - ${name}`,
      html: emailContent,
      text: buildTextContent(body), // Fallback para clientes que no soportan HTML
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
// 🔹 PLANTILLA HTML PREMIUM PARA EL EMAIL
// ─────────────────────────────────────────────────────────────
function buildEmailContent(data: ContactForm): string {
  const { name, contact, interest, message } = data;
  
  const styles = {
    container: 'font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0;',
    header: 'background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;',
    headerTitle: 'color: white; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;',
    headerSubtitle: 'color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;',
    body: 'background: #fafafa; padding: 24px; border-radius: 0 0 12px 12px;',
    card: 'background: white; padding: 20px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);',
    label: 'color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;',
    value: 'color: #18181b; font-size: 15px; font-weight: 500; margin: 0 0 12px 0;',
    messageBox: 'background: #fdf2f8; padding: 16px; border-radius: 8px; border-left: 4px solid #f43f5e; margin: 16px 0;',
    messageText: 'color: #3f3f46; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;',
    footer: 'text-align: center; padding: 24px; color: #a1a1aa; font-size: 12px;',
    badge: 'display: inline-block; background: linear-gradient(135deg, #f43f5e, #e11d48); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;',
    divider: 'height: 1px; background: linear-gradient(to right, transparent, #e4e4e7, transparent); margin: 20px 0;',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva consulta - SG Tu Look</title>
    </head>
    <body style="${styles.container}">
      
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">✨ Nueva Consulta</h1>
        <p style="${styles.headerSubtitle}">SG Tu Look</p>
      </div>

      <div style="${styles.body}">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="${styles.badge}">${interestLabels[interest] || interest}</span>
        </div>

        <div style="${styles.card}">
          <p style="${styles.label}">Nombre completo</p>
          <p style="${styles.value}">${name}</p>
          
          <p style="${styles.label}">Email o Teléfono de contacto</p>
          <p style="${styles.value}">${contact}</p>
        </div>

        <div style="${styles.card}">
          <p style="${styles.label}">Mensaje</p>
          <div style="${styles.messageBox}">
            <p style="${styles.messageText}">${message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>

        <div style="${styles.divider}"></div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="mailto:${contact.includes('@') ? contact : ''}?subject=Re: Consulta SG Tu Look" 
             style="display: inline-block; background: linear-gradient(135deg, #f43f5e, #e11d48); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Responder a ${name}
          </a>
        </div>

      </div>

      <div style="${styles.footer}">
        <p style="margin: 0 0 8px 0;"><strong>SG Tu Look</strong></p>
        <p style="margin: 0 0 4px 0;">📧 ${process.env.MAILER_EMAIL}</p>
        <p style="margin: 0;">Este mensaje fue enviado desde el formulario de contacto de <strong>SG Tu Look</strong>.</p>
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
NUEVA CONSULTA - SG TU LOOK
========================================================

INTERÉS: ${interestLabels[interest] || interest}

CONTACTO:
• Nombre: ${name}
• Email/Teléfono: ${contact}

MENSAJE:
${message}

---
Responder a: ${contact}
Enviado desde: Formulario web SG Tu Look
  `.trim();
}