// app/api/gestion/propiedades/opciones/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Property from '@/app/models/Property';
import Cliente from '@/app/models/Cliente';
import User from '@/app/models/User';
    

connectDB();

const isAuthorized = (role: string) => ['admin', 'superadmin', 'agente', 'vendedor'].includes(role);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAuthorized(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    // 🔹 1. Obtener valores únicos para filtros dinámicos (desde Property)
    const [barrios, ciudades, zonas] = await Promise.all([
      Property.distinct('direccion.barrio', { activo: true }),
      Property.distinct('direccion.ciudad', { activo: true }),
      Property.distinct('zona', { activo: true }),
    ]);

    // 🔹 2. Obtener propietarios (desde tu modelo de Clientes/Propietarios)
    // Ajustá el modelo y campos según tu estructura real
    const propietarios = await Cliente.find(
      { activo: { $ne: false } }, // Solo activos
      '_id nombre apellido razonSocial telefono email' // Campos a devolver
    ).lean();

    // 🔹 3. Obtener agentes (usuarios con rol agente/admin)
    // Ajustá según tu modelo de User y roles
    const agentes = await User.find(
      { 
        role: { $in: ['agente', 'admin', 'superadmin'] },
        activo: { $ne: false } 
      },
      '_id name email role'
    ).lean();

    return NextResponse.json({
      // Filtros de ubicación
      barrios: barrios.filter(Boolean).sort(),
      ciudades: ciudades.filter(Boolean).sort(),
      zonas: zonas.filter(Boolean).sort(),
      
      // Opciones estáticas
      tiposPropiedad: ['departamento', 'casa', 'local', 'oficina', 'terreno', 'cochera', 'galpon', 'ph'],
      tiposOperacion: ['venta', 'alquiler', 'ambos'],
      categorias: ['residencial', 'comercial', 'industrial', 'inversion'],
      estados: ['borrador', 'publicado', 'reservado', 'alquilado', 'vendido', 'baja'],
      monedas: ['ARS', 'USD'],
      
      // 👥 Equipos (LO QUE FALTABA)
      propietarios: propietarios || [],  // ← Array vacío si es null
      agentes: agentes || [],            // ← Array vacío si es null
    });
  } catch (error) {
    console.error('Error cargando opciones:', error);
    // Fallback seguro: devolver estructura completa con arrays vacíos
    return NextResponse.json({
      barrios: [], ciudades: [], zonas: [],
      tiposPropiedad: [], tiposOperacion: [], categorias: [], estados: [], monedas: [],
      propietarios: [],  // ← Importante: array vacío, no undefined
      agentes: [],       // ← Importante: array vacío, no undefined
    }, { status: 500 });
  }
}