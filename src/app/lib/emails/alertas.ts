import { formatARS } from '@/app/lib/formatcurrenci';

interface AlertaEmailData {
  userName: string;
  userEmail: string;
  alertaTipo: 'propiedad' | 'busqueda';
  propiedad?: {
    _id: string;
    titulo: string;
    imagen?: string;
    precio?: { monto?: number; moneda: string; tipo: string };
    direccion?: { barrio: string; ciudad: string; provincia?: string };
    cambioTipo: 'precio' | 'estado' | 'nueva';
    precioAnterior?: number;
    precioNuevo?: number;
    tipoOperacion?: string;
    slug?: string;
    
  };
  nuevasPropiedades?: Array<{
    _id: string;
    titulo: string;
    imagen?: string;
    precio?: { monto?: number; moneda: string; tipo: string };
    direccion?: { barrio: string; ciudad: string };
  }>;
  criterios?: any;
  baseUrl: string;
}

// 👇 Helper para ubicación segura (direccion, no ubicacion)
const getUbicacionDisplay = (prop: any) => {
  const dir = prop.direccion || {};
  const barrio = dir.barrio || 'Zona no especificada';
  const ciudad = dir.ciudad || '';
  const provincia = dir.provincia || '';
  
  if (ciudad && provincia) return `${barrio}, ${ciudad}, ${provincia}`;
  if (ciudad) return `${barrio}, ${ciudad}`;
  return barrio;
};

export function buildAlertaEmail(data: AlertaEmailData): { subject: string; html: string; text: string } {
  const { userName, alertaTipo, propiedad, nuevasPropiedades, baseUrl } = data;
  
  // Estilos inline (mismo patrón que tu send-mail)
  const styles = {
    container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 650px; margin: 0 auto; background: #0f172a;',
    header: 'background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); padding: 32px 24px; text-align: center;',
    headerTitle: 'color: white; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;',
    body: 'background: #0f172a; padding: 24px;',
    card: 'background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 16px;',
    badge: 'display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px;',
    propertyImage: 'width: 100%; max-width: 400px; border-radius: 8px; margin: 12px 0;',
    propertyTitle: 'color: white; font-size: 18px; font-weight: 600; margin: 12px 0 8px;',
    propertyPrice: 'color: #22c55e; font-size: 20px; font-weight: 700; margin: 8px 0;',
    propertyLocation: 'color: #94a3b8; font-size: 14px; margin: 4px 0;',
    changeBadge: 'display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; margin: 8px 0;',
    changePrice: 'background: #22c55e/20; color: #22c55e;',
    changeState: 'background: #f59e0b/20; color: #f59e0b;',
    changeNew: 'background: #3b82f6/20; color: #3b82f6;',
    ctaButton: 'display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin: 16px 0;',
    footer: 'text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; margin-top: 24px;',
    unsubscribe: 'color: #94a3b8; text-decoration: none; border-bottom: 1px dashed #64748b;',
  };

  // 🎯 Subject dinámico
  let subject = '🔔 Actualización de tus alertas inmobiliarias';
  if (alertaTipo === 'propiedad' && propiedad) {
    if (propiedad.cambioTipo === 'precio') {
      subject = `💰 Cambió el precio: ${propiedad.titulo}`;
    } else if (propiedad.cambioTipo === 'estado') {
      subject = `📋 Nueva actualización: ${propiedad.titulo}`;
    }
  } else if (alertaTipo === 'busqueda' && nuevasPropiedades?.length) {
    subject = `🏠 ${nuevasPropiedades.length} nueva${nuevasPropiedades.length > 1 ? 's' : ''} propiedad${nuevasPropiedades.length > 1 ? 'es' : ''} para vos`;
  }

  // 🎨 HTML Content
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="${styles.container}">
      
      <!-- Header -->
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">🏡 Jimena Sánchez Propiedades</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 0;">Alertas Personalizadas</p>
      </div>

      <!-- Body -->
      <div style="${styles.body}">
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 24px;">
          Hola <strong style="color: white;">${userName}</strong>,
        </p>
  `;

  // 🏠 Caso 1: Alerta de propiedad específica con cambios
  if (alertaTipo === 'propiedad' && propiedad) {
    const precioDisplay = propiedad.precio?.monto 
      ? formatARS(propiedad.precio.monto) 
      : 'Consultar';
    
    const cambioBadge = propiedad.cambioTipo === 'precio' 
      ? `<span style="${styles.changeBadge} ${styles.changePrice}">💰 Precio actualizado</span>`
      : propiedad.cambioTipo === 'estado'
        ? `<span style="${styles.changeBadge} ${styles.changeState}">📋 Estado cambiado</span>`
        : `<span style="${styles.changeBadge} ${styles.changeNew}">✨ Nueva oportunidad</span>`;

    // 👇 Ubicación segura con helper
    const ubicacionDisplay = getUbicacionDisplay(propiedad);

    htmlContent += `
      <div style="${styles.card}">
        ${cambioBadge}
        
        ${propiedad.imagen ? `<img src="${propiedad.imagen}" alt="${propiedad.titulo}" style="${styles.propertyImage}" />` : ''}
        
        <h2 style="${styles.propertyTitle}">${propiedad.titulo || 'Propiedad'}</h2>
        <p style="${styles.propertyPrice}">${precioDisplay}</p>
        <p style="${styles.propertyLocation}">📍 ${ubicacionDisplay}</p>
        
        ${propiedad.cambioTipo === 'precio' && propiedad.precioAnterior && propiedad.precioNuevo ? `
          <div style="margin: 16px 0; padding: 12px; background: #334155; border-radius: 8px;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px;">Cambio de precio:</p>
            <p style="color: #f87171; font-size: 14px; margin: 0; text-decoration: line-through;">
              ${formatARS(propiedad.precioAnterior)}
            </p>
            <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 4px 0 0;">
              ${formatARS(propiedad.precioNuevo)}
            </p>
          </div>
        ` : ''}
        
        <a href="${baseUrl}/propiedades/${propiedad.slug}" style="${styles.ctaButton}">
          Ver propiedad completa →
        </a>
      </div>
    `;
  }

  // 🔍 Caso 2: Alerta de búsqueda con nuevas propiedades
  else if (alertaTipo === 'busqueda' && nuevasPropiedades?.length) {
    htmlContent += `
      <div style="${styles.card}">
        <span style="${styles.badge}">🔍 Nuevas coincidencias</span>
        <p style="color: #e2e8f0; margin: 0 0 16px;">
          Encontramos ${nuevasPropiedades.length} propiedad${nuevasPropiedades.length > 1 ? 'es' : ''} que coincide${nuevasPropiedades.length > 1 ? 'n' : ''} con tus criterios:
        </p>
    `;
    
    nuevasPropiedades.slice(0, 3).forEach(prop => {
      const precioDisplay = prop.precio?.monto 
        ? formatARS(prop.precio.monto) 
        : 'Consultar';
      
      // 👇 Ubicación segura con helper
      const ubicacionDisplay = getUbicacionDisplay(prop);
      
      htmlContent += `
        <div style="border: 1px solid #334155; border-radius: 8px; padding: 12px; margin: 12px 0; background: #1e293b;">
          ${prop.imagen ? `<img src="${prop.imagen}" alt="${prop.titulo}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />` : ''}
          <h3 style="color: white; font-size: 16px; margin: 0 0 4px;">${prop.titulo || 'Propiedad'}</h3>
          <p style="color: #22c55e; font-weight: 600; margin: 4px 0;">${precioDisplay}</p>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0;">📍 ${ubicacionDisplay}</p>
          <a href="${baseUrl}/propiedad/${prop._id}" style="color: #8b5cf6; text-decoration: none; font-size: 14px; display: inline-block; margin-top: 8px;">
            Ver detalles →
          </a>
        </div>
      `;
    });
    
    if (nuevasPropiedades.length > 3) {
      htmlContent += `
        <p style="color: #94a3b8; font-size: 14px; margin: 16px 0 0; text-align: center;">
          + ${nuevasPropiedades.length - 3} propiedad${nuevasPropiedades.length - 3 > 1 ? 'es' : ''} más en tu cuenta
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <a href="${baseUrl}/propiedades?alerta=activa" style="${styles.ctaButton}">
            Ver todas las coincidencias
          </a>
        </div>
      `;
    }
    
    htmlContent += `</div>`;
  }

  // Footer común
  htmlContent += `
      </div>

      <!-- Footer -->
      <div style="${styles.footer}">
        <p style="margin: 0 0 8px;">
          <strong style="color: #e2e8f0;">Jimena Sánchez Propiedades</strong>
        </p>
        <p style="margin: 0 0 12px; color: #94a3b8;">
          Recibís este email porque configuraste alertas personalizadas.
        </p>
        <p style="margin: 0;">
          <a href="${baseUrl}/profile/alertas" style="${styles.unsubscribe}">
            Gestionar mis alertas
          </a>
          ·
          <a href="${baseUrl}/profile/alertas?cancelar=todos" style="${styles.unsubscribe}">
            Cancelar todas
          </a>
        </p>
        <p style="margin: 16px 0 0; font-size: 11px; color: #64748b;">
          © ${new Date().getFullYear()} Jimena Sánchez Propiedades · Buenos Aires, Argentina
        </p>
      </div>

    </body>
    </html>
  `;

  // 📝 Text fallback
  const textContent = `
Hola ${userName},

${subject}

${alertaTipo === 'propiedad' && propiedad ? `
Propiedad: ${propiedad.titulo}
Ubicación: ${getUbicacionDisplay(propiedad)}
Precio: ${propiedad.precio?.monto ? formatARS(propiedad.precio.monto) : 'Consultar'}

Ver: ${baseUrl}/propiedades/${propiedad.tipoOperacion}/${propiedad.slug}
` : ''}

${alertaTipo === 'busqueda' && nuevasPropiedades?.length ? `
Encontramos ${nuevasPropiedades.length} propiedad${nuevasPropiedades.length > 1 ? 'es' : ''} nueva${nuevasPropiedades.length > 1 ? 's' : ''}:

${nuevasPropiedades.slice(0, 3).map(p => `• ${p.titulo} - ${getUbicacionDisplay(p)} - ${p.precio?.monto ? formatARS(p.precio.monto) : 'Consultar'}`).join('\n')}

Ver todas: ${baseUrl}/propiedades?alerta=activa
` : ''}

---
Gestionar alertas: ${baseUrl}/perfil/alertas
Jimena Sánchez Propiedades · Buenos Aires
  `.trim();

  return { subject, html: htmlContent, text: textContent };
}