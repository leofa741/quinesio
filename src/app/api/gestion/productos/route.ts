// app/api/gestion/productos/route.ts
import { authOptions } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongoose";
import Product from "@/app/models/Product"; // ⚠️ Asegúrate de tener este modelo creado
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

connectDB();

// 🔒 Helper: verificar roles autorizados para gestión de productos
const isAuthorized = (role: string) => ['admin', 'superadmin', 'vendedor'].includes(role);

// ─────────────────────────────────────────────────────────────
// 🔍 GET: Listar productos con paginación y filtros
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAuthorized(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    
    // Filtros básicos
    const categoria = searchParams.get('categoria');
    const destacado = searchParams.get('destacado');
    const nuevo = searchParams.get('nuevo');

    const query: any = {};
    if (categoria) query.categoria = categoria;
    if (destacado !== null) query.destacado = destacado === 'true';
    if (nuevo !== null) query.nuevo = nuevo === 'true';

    if (all) {
      const productos = await Product.find(query).sort({ createdAt: -1, nombre: 1 });
      return NextResponse.json(
        { productos },
        { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
      );
    }

    // Paginación
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments(query);
    const productos = await Product.find(query)
      .sort({ createdAt: -1, nombre: 1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      { productos, total, page, totalPages: Math.ceil(total / limit) },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// ➕ POST: Crear nuevo producto
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAuthorized(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const data = await req.json();

    // ✅ Validaciones de campos obligatorios
    if (!data.nombre || !data.descripcion || !data.categoria || data.precio == null || !data.moneda) {
      return NextResponse.json({ 
        error: 'Nombre, descripción, categoría, precio y moneda son obligatorios' 
      }, { status: 400 });
    }

    // ✅ Validar precio
    if (typeof data.precio !== 'number' || data.precio < 0) {
      return NextResponse.json({ error: 'El precio debe ser un número mayor o igual a 0' }, { status: 400 });
    }

    // ✅ Validar enums
    const validCategorias = ['vestidos', 'remeras', 'pantalones', 'accesorios', 'outwear'];
    const validMonedas = ['ARS', 'USD'];
    
    if (!validCategorias.includes(data.categoria)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 });
    }
    if (!validMonedas.includes(data.moneda)) {
      return NextResponse.json({ error: 'Moneda inválida' }, { status: 400 });
    }

    // ✅ Validar imágenes: mínimo 1, máximo 5
    if (!Array.isArray(data.imagenes) || data.imagenes.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos una imagen' }, { status: 400 });
    }
    if (data.imagenes.length > 5) {
      return NextResponse.json({ error: 'Máximo 5 imágenes por producto' }, { status: 400 });
    }
    for (const img of data.imagenes) {
      if (typeof img !== 'string' || !img.trim()) {
        return NextResponse.json({ error: 'Cada imagen debe ser una URL válida' }, { status: 400 });
      }
    }

    // ✅ Preparar datos para guardar
    const rawSlug = data.slug || data.nombre;
    const generatedSlug = rawSlug
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const productData = {
      nombre: String(data.nombre).trim(),
      descripcion: String(data.descripcion).trim(),
      categoria: data.categoria,
      precio: Number(data.precio),
      moneda: data.moneda,
      imagenes: data.imagenes.map((img: string) => String(img).trim()),
      slug: generatedSlug,
      destacado: Boolean(data.destacado),
      nuevo: Boolean(data.nuevo),
      caracteristicas: {
        talle: String(data.caracteristicas?.talle || '').trim(),
        color: String(data.caracteristicas?.color || '').trim(),
        material: String(data.caracteristicas?.material || '').trim(),
      }
    };

    const product = new Product(productData);
    await product.save();

    return NextResponse.json(product, { status: 201 });

  } catch (error: any) {
    console.error('Error al crear producto:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Ya existe un producto con este nombre o slug.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error inesperado al crear el producto' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// ✏️ PUT: Actualizar producto existente
// ─────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAuthorized(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del producto es requerido' }, { status: 400 });
    }

    const data = await req.json();

    // Validaciones básicas similares al POST
    if (data.precio !== undefined && (typeof data.precio !== 'number' || data.precio < 0)) {
      return NextResponse.json({ error: 'El precio debe ser un número mayor o igual a 0' }, { status: 400 });
    }

    if (data.imagenes !== undefined) {
      if (!Array.isArray(data.imagenes) || data.imagenes.length === 0) {
        return NextResponse.json({ error: 'Se requiere al menos una imagen' }, { status: 400 });
      }
      if (data.imagenes.length > 5) {
        return NextResponse.json({ error: 'Máximo 5 imágenes por producto' }, { status: 400 });
      }
    }

    // Preparar datos actualizados (solo los campos que vienen en el body)
    const updateData: any = {};
    if (data.nombre) updateData.nombre = String(data.nombre).trim();
    if (data.descripcion !== undefined) updateData.descripcion = String(data.descripcion).trim();
    if (data.categoria) updateData.categoria = data.categoria;
    if (data.precio !== undefined) updateData.precio = Number(data.precio);
    if (data.moneda) updateData.moneda = data.moneda;
    if (data.imagenes) updateData.imagenes = data.imagenes.map((img: string) => String(img).trim());
    if (data.destacado !== undefined) updateData.destacado = Boolean(data.destacado);
    if (data.nuevo !== undefined) updateData.nuevo = Boolean(data.nuevo);
    
    if (data.caracteristicas) {
      updateData.caracteristicas = {
        talle: String(data.caracteristicas.talle || '').trim(),
        color: String(data.caracteristicas.color || '').trim(),
        material: String(data.caracteristicas.material || '').trim(),
      };
    }

    // Regenerar slug si cambió el nombre y no se pasó un slug nuevo
    if (data.nombre && !data.slug) {
      updateData.slug = String(data.nombre)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);

  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Ya existe otro producto con este nombre o slug' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// 🗑️ DELETE: Eliminar producto
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAuthorized(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del producto es requerido' }, { status: 400 });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Producto eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}