// app/api/visitas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import Visita from '@/app/models/Visita';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { propiedadId, slug, visitorId } = body;
    
    if (!propiedadId || !slug || !visitorId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }
    
    // Verificar si ya existe una visita de este visitor para esta propiedad
    const visitaExistente = await Visita.findOne({
      propiedadId,
      visitorId
    });
    
    if (visitaExistente) {
      // Ya existe, no contar de nuevo
      return NextResponse.json({ 
        success: true, 
        counted: false,
        message: 'Visita ya registrada'
      });
    }
    
    // Crear nueva visita
    const nuevaVisita = new Visita({
      propiedadId,
      slug,
      visitorId
    });
    
    await nuevaVisita.save();
    
    return NextResponse.json({ 
      success: true, 
      counted: true,
      message: 'Visita registrada'
    });
    
  } catch (error) {
    console.error('Error registrando visita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET para obtener el conteo de visitas únicas
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug requerido' },
        { status: 400 }
      );
    }
    
    const visitasCount = await Visita.countDocuments({ slug });
    
    return NextResponse.json({ 
      success: true, 
      count: visitasCount 
    });
    
  } catch (error) {
    console.error('Error obteniendo visitas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}