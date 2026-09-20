import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/mongoose';
import UserModel, { IUser } from '@/app/models/User';

connectDB();

// Helper seguro para obtener _id como string
function getUserId(user: IUser | null): string {
  if (!user?._id) return '';
  return typeof user._id === 'string' 
    ? user._id 
    : (user._id as any).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      password,
      name = '',
      lastName = '',
      phone = '',
      address = '',
      city = '',
      zipCode = ''
    } = body;

    // 1. Validar campos requeridos
    if (!email || !password || !name) {
      return NextResponse.json({ message: 'Nombre, email y contraseña son requeridos' }, { status: 400 });
    }

    // 2. Validar que el correo no esté registrado (en minúsculas para evitar duplicados por mayúsculas)
    const emailLower = email.toLowerCase();
    const userExists = await UserModel.findOne({ email: emailLower });
    
    if (userExists) {
      return NextResponse.json({ message: 'El correo ya está registrado' }, { status: 400 });
    }

    // 3. Crear usuario 
    // NOTA: No necesitamos hashear la password aquí. El middleware pre('save') del modelo User lo hace automáticamente.
    const newUser = new UserModel({ 
      email: emailLower, 
      password,
      name,
      lastName,
      phone,
      address,
      city,
      zipCode,
      role: 'pacientes', // ✅ Rol por defecto para registros desde la web
      google: false,
      activo: true,
    });
    
    await newUser.save();

    // 4. Obtener ID como string para el JWT
    const userId = getUserId(newUser);

    // 5. Generar token JWT
    const token = jwt.sign(
      { 
        id: userId,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        lastName: newUser.lastName,
      }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '5h' }
    );

    // 6. Retornar respuesta exitosa
    return NextResponse.json({ 
      message: 'Usuario registrado exitosamente', 
      token,
      user: {
        id: userId,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        lastName: newUser.lastName,
        phone: newUser.phone,
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Error en registro:', error);
    
    // Manejo específico de error de duplicado de MongoDB (por si acaso)
    if (error.code === 11000) {
      return NextResponse.json({ message: 'El correo ya está registrado' }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}