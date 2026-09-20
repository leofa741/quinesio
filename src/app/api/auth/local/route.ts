import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '@/app/lib/mongoose';
import User from '@/app/models/User';

connectDB();

// Inicio de Sesión
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Correo y contraseña son requeridos' }, { status: 400 });
    }

    // Buscar el usuario (incluyendo la contraseña gracias a select: false en el schema, 
    // pero necesitamos pedirla explícitamente o quitar select: false si ya la tienes así)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return NextResponse.json({ message: 'Correo o contraseña incorrectos' }, { status: 400 });
    }

    // ✅ CORRECCIÓN: Verificar que el usuario tenga contraseña antes de comparar
    // (Los usuarios registrados con Google no tienen contraseña)
    if (!user.password) {
      return NextResponse.json({ 
        message: 'Esta cuenta fue creada con Google. Por favor, inicia sesión con Google.' 
      }, { status: 400 });
    }

    // Comparar contraseñas (Ahora TypeScript sabe que user.password es string)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Correo o contraseña incorrectos' }, { status: 400 });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        role: user.role, 
        name: user.name,
        lastName: user.lastName
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '5h' }
    );

    return NextResponse.json({ 
      message: 'Inicio de sesión exitoso', 
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        lastName: user.lastName
      }
    }, { status: 200 });

  } catch (error) {
    console.error('API Error en Login:', error);
    return NextResponse.json({ message: 'Error en el servidor' }, { status: 500 });
  }
}