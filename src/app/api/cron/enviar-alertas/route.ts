import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import AlertaModel from '@/app/models/Alerta';
import PropertyModel from '@/app/models/Property'; // ✅ Nombre correcto del modelo
import UserModel from '@/app/models/User';
import { buildAlertaEmail } from '@/app/lib/emails/alertas';
import nodemailer from 'nodemailer';

// 🔐 Proteger endpoint con secret (para Vercel Cron)
function verifyCronSecret(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return false;
  }
  return true;
}

export async function GET(req: Request) {
  // Solo permitir GET para cron jobs
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await connectDB();
    
    const now = new Date();
    let totalEnviados = 0;
    const resultados: any[] = [];

    // 🔍 1. Alertas de propiedad con cambios de precio/estado
    const alertasPropiedad = await AlertaModel.find({
      tipo: 'propiedad',
      activo: true,
      eliminado: false,
      frecuencia: { $in: ['inmediato', 'diario'] }
    }).populate('propiedad').populate('usuario');

    for (const alerta of alertasPropiedad) {
      try {
        const propiedad = alerta.propiedad;
        if (!propiedad) continue;

        // Verificar si hubo cambios desde el último envío
        const hayCambios = propiedad.updatedAt > (alerta.ultimoEnvio || propiedad.createdAt);
        if (!hayCambios) continue;

        const usuario = alerta.usuario;
        if (!usuario?.email) continue;

        // Configurar transporter (mismo que tu send-mail)
        const transporter = nodemailer.createTransport({
          service: process.env.MAILER_SERVICE || 'gmail',
          auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_SECRET_KEY,
          },
        });

        // console.log(propiedad);

        // 👇 CORRECCIÓN: mapear 'direccion', no 'ubicacion'
        // También ajustar precios según tu schema (precios.venta / precios.alquiler)
        const precioActivo = propiedad.tipoOperacion === 'venta' 
          ? propiedad.precios?.venta 
          : propiedad.precios?.alquiler;

        // Construir email
        const { subject, html, text } = buildAlertaEmail({
          userName: usuario.name || usuario.email.split('@')[0],
          userEmail: usuario.email,
          alertaTipo: 'propiedad',
          propiedad: {
            _id: propiedad._id.toString(),
            titulo: propiedad.titulo,
            imagen: propiedad.imagenes?.[0]?.url, // 👈 Ajustado a tu schema de imagenes[]
            precio: precioActivo,
            // 👇 CORRECCIÓN CLAVE: direccion, no ubicacion
            direccion: propiedad.direccion,
            cambioTipo: 'precio', // 🔹 Podés mejorar esta lógica comparando versiones
            precioAnterior: undefined, // Si tenés historial de precios, usalo aquí
            precioNuevo: precioActivo?.monto,
            tipoOperacion: propiedad.tipoOperacion,            
            slug: propiedad.seo?.slug,            
          },
          baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://tumarca.ar'
        });

        // Enviar
        await transporter.sendMail({
          from: `"Jimena Sánchez Propiedades" <${process.env.MAILER_EMAIL}>`,
          to: usuario.email,
          subject,
          html,
          text
        });

        // Actualizar alerta
        alerta.ultimoEnvio = now;
        alerta.totalEnvios += 1;
        await alerta.save();

        totalEnviados++;
        resultados.push({ alerta: alerta._id, email: usuario.email, status: 'enviado' });

      } catch (error) {
        console.error(`❌ Error enviando alerta ${alerta._id}:`, error);
        resultados.push({ alerta: alerta._id, status: 'error', error: String(error) });
      }
    }

    // 🔍 2. Alertas de búsqueda con nuevas propiedades
    const alertasBusqueda = await AlertaModel.find({
      tipo: 'busqueda',
      activo: true,
      eliminado: false,
      frecuencia: { $in: ['diario', 'semanal'] }
    }).populate('usuario');

    for (const alerta of alertasBusqueda) {
      try {
        // Verificar frecuencia (semanal solo los lunes)
        if (alerta.frecuencia === 'semanal' && now.getDay() !== 1) {
          continue;
        }

        // Verificar si ya se envió hoy
        if (alerta.ultimoEnvio && 
            new Date(alerta.ultimoEnvio).toDateString() === now.toDateString()) {
          continue;
        }

        const usuario = alerta.usuario;
        if (!usuario?.email) continue;

        // Buscar propiedades que coincidan con los criterios
        const query: any = {
          estado: 'publicado',
          eliminado: { $ne: true }
        };

        if (alerta.criterios?.tipoOperacion) {
          query.tipoOperacion = { $in: [alerta.criterios.tipoOperacion, 'ambos'] };
        }
        if (alerta.criterios?.tipoPropiedad?.length) {
          query.tipoPropiedad = { $in: alerta.criterios.tipoPropiedad };
        }
        // 👇 CORRECCIÓN: buscar por 'direccion.barrio', no 'ubicacion.barrio'
        if (alerta.criterios?.ubicacion?.barrio?.length) {
          query['direccion.barrio'] = { $in: alerta.criterios.ubicacion.barrio };
        }
        if (alerta.criterios?.ubicacion?.precioMin) {
          query['precios.venta.monto'] = { $gte: alerta.criterios.ubicacion.precioMin };
        }
        if (alerta.criterios?.ubicacion?.precioMax) {
          query['precios.venta.monto'] = { ...query['precios.venta.monto'], $lte: alerta.criterios.ubicacion.precioMax };
        }

        // Solo propiedades creadas después del último envío
        query.createdAt = { $gt: alerta.ultimoEnvio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };

        const nuevasProps = await PropertyModel.find(query)
          .limit(10)
          .sort({ createdAt: -1 });

        if (nuevasProps.length === 0) continue;

        // Configurar transporter
        const transporter = nodemailer.createTransport({
          service: process.env.MAILER_SERVICE || 'gmail',
          auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_SECRET_KEY,
          },
        });

        // 👇 CORRECCIÓN: mapear 'direccion' en lugar de 'ubicacion'
        const nuevasPropiedadesParaEmail = nuevasProps.map(p => {
          const precioActivo = p.tipoOperacion === 'venta' ? p.precios?.venta : p.precios?.alquiler;
          return {
            _id: p._id.toString(),
            titulo: p.titulo,
            imagen: p.imagenes?.[0]?.url,
            precio: precioActivo,
            // 👇 CORRECCIÓN CLAVE: direccion, no ubicacion
            direccion: p.direccion
          };
        });

        // Construir email
        const { subject, html, text } = buildAlertaEmail({
          userName: usuario.name || usuario.email.split('@')[0],
          userEmail: usuario.email,
          alertaTipo: 'busqueda',
          nuevasPropiedades: nuevasPropiedadesParaEmail,
          criterios: alerta.criterios,
          baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://tumarca.ar'
          
        });

        // Enviar
        await transporter.sendMail({
          from: `"Jimena Sánchez Propiedades" <${process.env.MAILER_EMAIL}>`,
          to: usuario.email,
          subject,
          html,
          text
        });

        // Actualizar alerta
        alerta.ultimoEnvio = now;
        alerta.totalEnvios += 1;
        await alerta.save();

        totalEnviados += nuevasProps.length;
        resultados.push({ 
          alerta: alerta._id, 
          email: usuario.email, 
          nuevasPropiedades: nuevasProps.length,
          status: 'enviado' 
        });

      } catch (error) {
        console.error(`❌ Error enviando alerta búsqueda ${alerta._id}:`, error);
        resultados.push({ alerta: alerta._id, status: 'error', error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalEnviados,
      resultados: resultados.slice(0, 20) // Limitar response size
    });

  } catch (error) {
    console.error('❌ Error en cron job de alertas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}