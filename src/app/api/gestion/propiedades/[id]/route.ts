// app/api/gestion/propiedades/[id]/route.ts
import connectDB from '@/app/lib/mongoose';
import Property from '@/app/models/Property';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeProperty, notifyProperties } from '../events/propertiesNotifier';
import { Types } from 'mongoose';

connectDB();

const isAuthorized = (role: string) => ['admin', 'superadmin', 'agente'].includes(role);

// 🔍 GET: Obtener propiedad por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de propiedad inválido' }, { status: 400 });
    }

    const propiedad = await Property.findById(id)
      .populate('propietario', 'razonSocial nombre apellido telefono email')
      .populate('agente', 'name email role');

    if (!propiedad) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(normalizeProperty(propiedad));
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ✏️ PUT: Actualizar propiedad
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || !isAuthorized(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  // ✅ 1. Manejo seguro del cuerpo de la solicitud
  let body;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error('Error al parsear JSON en PUT propiedad:', parseError);
    return NextResponse.json({ error: 'Formato JSON inválido en la solicitud' }, { status: 400 });
  }

  // ✅ 2. Verificar existencia
  const propiedadExistente = await Property.findById(id);
  if (!propiedadExistente) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
  }

  // ✅ 3. Verificar permisos: agente solo puede editar sus propiedades
  if (session.user.role === 'agente' && propiedadExistente.agente?.toString() !== session.user.id) {
    return NextResponse.json({ error: 'No tienes permiso para editar esta propiedad' }, { status: 403 });
  }

  // ✅ 4. Determinar si es actualización parcial
  const camposFormularioCompleto = ['titulo', 'descripcion', 'tipoPropiedad', 'tipoOperacion', 'direccion', 'precios'];
  const esParcial = !camposFormularioCompleto.every(campo => campo in body);

  let updateData: Record<string, any> = {};

  // 👇 Manejo del campo `propietario` y `agente`
  if ('propietario' in body) {
    const propValue = body.propietario;
    if (propValue === null || propValue === '' || propValue === undefined) {
      return NextResponse.json({ error: 'El propietario es requerido' }, { status: 400 });
    }
    updateData.propietario = propValue;
  }

  if ('agente' in body && session.user.role !== 'agente') {
    // Solo admin puede reasignar agente
    const agenteValue = body.agente;
    if (agenteValue === null || agenteValue === '' || agenteValue === undefined) {
      return NextResponse.json({ error: 'El agente es requerido' }, { status: 400 });
    }
    updateData.agente = agenteValue;
  }

  if (esParcial) {
    // ✅ Actualización parcial: solo permitir campos específicos

    if ('activo' in body) updateData.activo = Boolean(body.activo);

    if ('estado' in body) {
      const validEstados = ['borrador', 'publicado', 'reservado', 'alquilado', 'vendido', 'baja'];
      if (!validEstados.includes(body.estado)) {
        return NextResponse.json({ error: 'estado inválido' }, { status: 400 });
      }
      updateData.estado = body.estado;

      // Si cambia a vendido/alquilado, actualizar fechaDisponibilidad
      if (['vendido', 'alquilado'].includes(body.estado) && !body.fechaDisponibilidad) {
        updateData.fechaDisponibilidad = new Date();
      }
    }

    if ('destacado' in body) updateData.destacado = Boolean(body.destacado);
    if ('urgente' in body) updateData.urgente = Boolean(body.urgente);

    // ✅ Actualizar precios parcialmente
    if ('precios' in body) {
      if (body.precios.venta !== undefined) {
        if (body.precios.venta === null) {
          updateData['precios.venta'] = null;
        } else if (typeof body.precios.venta === 'object') {
          if (body.precios.venta.monto != null && (typeof body.precios.venta.monto !== 'number' || body.precios.venta.monto < 0)) {
            return NextResponse.json({ error: 'Precio de venta inválido' }, { status: 400 });
          }
          updateData['precios.venta'] = {
            ...propiedadExistente.precios?.venta,
            ...body.precios.venta,
            moneda: body.precios.venta.moneda || propiedadExistente.precios?.venta?.moneda || 'USD',
          };
        }
      }
      if (body.precios.alquiler !== undefined) {
        if (body.precios.alquiler === null) {
          updateData['precios.alquiler'] = null;
        } else if (typeof body.precios.alquiler === 'object') {
          if (body.precios.alquiler.monto != null && (typeof body.precios.alquiler.monto !== 'number' || body.precios.alquiler.monto < 0)) {
            return NextResponse.json({ error: 'Precio de alquiler inválido' }, { status: 400 });
          }
          updateData['precios.alquiler'] = {
            ...propiedadExistente.precios?.alquiler,
            ...body.precios.alquiler,
            moneda: body.precios.alquiler.moneda || propiedadExistente.precios?.alquiler?.moneda || 'USD',
          };
        }
      }
      if (body.precios.expensas !== undefined) {
        updateData['precios.expensas'] = body.precios.expensas === null ? null : Number(body.precios.expensas);
      }
    }

    // ✅ Actualizar imágenes: reemplazar array completo o permitir operaciones parciales vía endpoint separado
    if ('imagenes' in body) {
      if (!Array.isArray(body.imagenes)) {
        return NextResponse.json({ error: 'imagenes debe ser un arreglo' }, { status: 400 });
      }
      if (body.imagenes.length > 22) {
        return NextResponse.json({ error: 'Máximo 22 imágenes por propiedad' }, { status: 400 });
      }
      // Validar y procesar
      const hasPrincipal = body.imagenes.some((img: any) => img.principal === true);
      updateData.imagenes = body.imagenes.map((img: any, index: number) => ({
        url: String(img.url).trim(),
        descripcion: img.descripcion?.trim() || null,
        principal: Boolean(img.principal),
        orden: typeof img.orden === 'number' ? img.orden : index,
        tipo: img.tipo || 'foto',
      }));
      // Asegurar principal
      if (!hasPrincipal && updateData.imagenes.length > 0) {
        updateData.imagenes[0].principal = true;
      }
    }

    // ✅ Actualizar características parcialmente
    if ('caracteristicas' in body && typeof body.caracteristicas === 'object') {
      updateData.caracteristicas = {
        ...propiedadExistente.caracteristicas?.toObject?.() || propiedadExistente.caracteristicas,
        ...body.caracteristicas,
      };
    }

    // ✅ Actualizar dirección parcialmente
    if ('direccion' in body && typeof body.direccion === 'object') {
      const dir = body.direccion;
      // Validar campos requeridos si se envían
      if (dir.calle !== undefined && !dir.calle) return NextResponse.json({ error: 'calle no puede estar vacío' }, { status: 400 });
      if (dir.numero !== undefined && !dir.numero) return NextResponse.json({ error: 'numero no puede estar vacío' }, { status: 400 });
      if (dir.barrio !== undefined && !dir.barrio) return NextResponse.json({ error: 'barrio no puede estar vacío' }, { status: 400 });

      updateData.direccion = {
        ...propiedadExistente.direccion?.toObject?.() || propiedadExistente.direccion,
        ...dir,
        calle: dir.calle !== undefined ? String(dir.calle).trim() : undefined,
        numero: dir.numero !== undefined ? String(dir.numero).trim() : undefined,
        barrio: dir.barrio !== undefined ? String(dir.barrio).trim() : undefined,
        ciudad: dir.ciudad !== undefined ? String(dir.ciudad).trim() : undefined,
        provincia: dir.provincia !== undefined ? String(dir.provincia).trim() : undefined,
      };
    }

  } else {
    // ✅ Actualización completa: validar todos los campos requeridos

    const { titulo, descripcion, tipoPropiedad, tipoOperacion, direccion, precios } = body;

    if (!titulo || !descripcion || !tipoPropiedad || !tipoOperacion) {
      return NextResponse.json({ error: 'Título, descripción, tipoPropiedad y tipoOperación son obligatorios' }, { status: 400 });
    }

    // Validar dirección
    if (!direccion || !direccion.calle || !direccion.numero || !direccion.barrio || !direccion.ciudad || !direccion.provincia) {
      return NextResponse.json({ error: 'Dirección incompleta' }, { status: 400 });
    }

    // Validar precios
    const ventaMonto = precios?.venta?.monto;
    const alquilerMonto = precios?.alquiler?.monto;
    if (!ventaMonto && !alquilerMonto) {
      return NextResponse.json({ error: 'Debe especificar al menos un precio de venta o alquiler' }, { status: 400 });
    }
    if (ventaMonto != null && (typeof ventaMonto !== 'number' || ventaMonto < 0)) {
      return NextResponse.json({ error: 'Precio de venta inválido' }, { status: 400 });
    }
    if (alquilerMonto != null && (typeof alquilerMonto !== 'number' || alquilerMonto < 0)) {
      return NextResponse.json({ error: 'Precio de alquiler inválido' }, { status: 400 });
    }

    // Validar imágenes
    if (!Array.isArray(body.imagenes) || body.imagenes.length === 0 || body.imagenes.length > 22) {
      return NextResponse.json({ error: 'Se requieren entre 1 y 22 imágenes válidas' }, { status: 400 });
    }

    // Validar enums
    const validTiposPropiedad = ['departamento', 'casa', 'local', 'oficina', 'terreno', 'galpon', 'ph', 'campo', 'barrio cerrado', 'urbanizacion protegida', 'cochera'];
    const validTiposOperacion = ['venta', 'alquiler', 'ambos'];
    if (!validTiposPropiedad.includes(tipoPropiedad) || !validTiposOperacion.includes(tipoOperacion)) {
      return NextResponse.json({ error: 'tipoPropiedad o tipoOperacion inválido' }, { status: 400 });
    }

    // Preparar updateData completo
    updateData = {
      titulo: String(titulo).trim(),
      descripcion: String(descripcion).trim(),
      codigoInterno: body.codigoInterno?.trim() || null,
      tipoPropiedad,
      tipoOperacion,
      categoria: body.categoria || 'residencial',
      direccion: {
        calle: String(direccion.calle).trim(),
        numero: String(direccion.numero).trim(),
        piso: direccion.piso?.trim() || null,
        depto: direccion.depto?.trim() || null,
        barrio: String(direccion.barrio).trim(),
        ciudad: String(direccion.ciudad).trim(),
        provincia: String(direccion.provincia).trim(),
        codigoPostal: direccion.codigoPostal?.trim() || null,
        coordenadas: direccion.coordenadas || null,
        mostrarDireccionExacta: Boolean(direccion.mostrarDireccionExacta),
      },
      zona: body.zona?.trim() || null,
      caracteristicas: body.caracteristicas || {},
      precios: {
        venta: precios.venta ? {
          moneda: precios.venta.moneda || 'USD',
          monto: precios.venta.monto,
          comision: precios.venta.comision ?? 3,
          gastosEscrituracion: precios.venta.gastosEscrituracion ?? true,
        } : undefined,
        alquiler: precios.alquiler ? {
          moneda: precios.alquiler.moneda || 'USD',
          monto: precios.alquiler.monto,
          comision: precios.alquiler.comision ?? 4.5,
          ajuste: precios.alquiler.ajuste || 'anual',
          garantiaRequerida: precios.alquiler.garantiaRequerida || 'propiedad',
        } : undefined,
        expensas: precios.expensas ?? null,
        impuestos: precios.impuestos ?? null,
      },
      imagenes: body.imagenes.map((img: any, index: number) => ({
        url: String(img.url).trim(),
        descripcion: img.descripcion?.trim() || null,
        principal: Boolean(img.principal),
        orden: typeof img.orden === 'number' ? img.orden : index,
        tipo: img.tipo || 'foto',
      })),
      videoUrl: body.videoUrl?.trim() || null,
      tourVirtualUrl: body.tourVirtualUrl?.trim() || null,
      planoUrl: body.planoUrl?.trim() || null,
      estado: body.estado || propiedadExistente.estado,
      fechaPublicacion: body.fechaPublicacion ? new Date(body.fechaPublicacion) : propiedadExistente.fechaPublicacion,
      fechaDisponibilidad: body.fechaDisponibilidad ? new Date(body.fechaDisponibilidad) : propiedadExistente.fechaDisponibilidad,
      destacado: Boolean(body.destacado),
      urgente: Boolean(body.urgente),
      notasInternas: body.notasInternas?.trim() || null,
      seo: body.seo ? {
        slug: body.seo.slug?.trim() || null,
        metaTitle: body.seo.metaTitle?.trim() || null,
        metaDescription: body.seo.metaDescription?.trim() || null,
      } : propiedadExistente.seo,
      updatedAt: new Date(),
      // propietario y agente se manejan arriba
    };

    // Regenerar slug si cambió el título y no hay slug manual
    if (titulo !== propiedadExistente.titulo && !body.seo?.slug) {
      const base = String(titulo)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      updateData['seo.slug'] = base;
    }
  }

  try {
    // 👇 Poblar relaciones al devolver
    const propiedadActualizada = await Property.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('propietario', 'razonSocial nombre apellido')
      .populate('agente', 'name email');

    if (!propiedadActualizada) {
      return NextResponse.json({ error: 'No se pudo actualizar la propiedad' }, { status: 500 });
    }

    notifyProperties({
      type: 'propiedad_actualizada',
      data: normalizeProperty(propiedadActualizada),
    });

    return NextResponse.json(normalizeProperty(propiedadActualizada));
  } catch (error: any) {
    console.error('Error al actualizar propiedad:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Ya existe una propiedad con este slug o código interno.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al guardar los cambios' }, { status: 500 });
  }
}

// 🗑️ DELETE: Soft delete (desactivar propiedad)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || !isAuthorized(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de propiedad inválido' }, { status: 400 });
    }

    const propiedad = await Property.findById(id);
    if (!propiedad) {
      return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    }

    // Verificar permisos para agente
    if (session.user.role === 'agente' && propiedad.agente?.toString() !== session.user.id) {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta propiedad" }, { status: 403 });
    }

    // ✅ Soft delete: marcar como inactivo + estado 'baja'
    const updated = await Property.findByIdAndUpdate(
      id,
      {
        activo: false,
        estado: 'baja',
        fechaBaja: new Date(),
        bajaPor: session.user.id
      },
      { new: true }
    );

    notifyProperties({
      type: "propiedad_eliminada",
      data: { id: updated._id, estado: updated.estado },
    });

    return NextResponse.json({ message: "Propiedad eliminada exitosamente", data: { id: updated._id } });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    return NextResponse.json({ error: "Error al eliminar propiedad" }, { status: 500 });
  }
}