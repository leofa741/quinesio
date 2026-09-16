// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/mongoose';
import UserModel, { IUser } from '@/app/models/User'; // ✅ Importar modelo + interfaz
import Cliente from '@/app/models/Cliente';
import bcrypt from 'bcryptjs';

connectDB();

// ✅ Funciones de normalización
function normalizeTelefono(text: string): string {
  if (!text) return '00000000';
  return text.trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '') || '00000000';
}

function normalizeRazonSocial(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// ✅ Helper seguro para obtener _id como string
function getUserId(user: IUser | null): string {
  if (!user?._id) return '';
  return typeof user._id === 'string' 
    ? user._id 
    : (user._id as mongoose.Types.ObjectId).toString();
}

async function crearClienteAutomatico(userData: {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}) {
  try {
    const clienteExistente = await Cliente.findOne({ email: userData.email });
    if (clienteExistente) {
      console.log(`✅ Cliente ya existe para ${userData.email}`);
      return;
    }

    const nombre = userData.name?.trim() || 'Usuario';
    const apellido = userData.lastName?.trim() || '';
    const razonSocial = `${nombre} ${apellido}`.trim() || userData.email;
    const telefono = userData.phone?.trim() || '00000000';

    const razonSocialNormalized = normalizeRazonSocial(razonSocial);
    const telefonoNormalized = normalizeTelefono(telefono);

    const nuevoCliente = new Cliente({
      razonSocial,
      razonSocialNormalized,
      nombre,
      apellido,
      email: userData.email,
      telefono,
      telefonoNormalized,
      direccion: userData.address || '',
      ciudad: userData.city || '',
      provincia: '',
      formaPago: 'efectivo',
      activo: true,
      origen: 'registro_manual'
    });

    await nuevoCliente.save();
    console.log(`✅ Cliente creado automáticamente para ${userData.email}`);
  } catch (error) {
    console.error('❌ Error creando cliente automático:', error);
  }
}

// Registro de Usuario
export async function POST(req: NextRequest) {
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

  try {
    // Validar que el correo no esté registrado
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return NextResponse.json({ message: 'El correo ya está registrado' }, { status: 400 });
    }

    // ✅ CORREGIDO: Crear usuario con tipado explícito
    const newUser = new UserModel({ 
      email, 
      password,
      name,
      lastName,
      phone,
      address,
      city,
      zipCode,
      role: 'pacientes',
      google: false,
      activo: true,
    }) as IUser;
    
    await newUser.save();

    // ✅ Crear cliente automáticamente
    await crearClienteAutomatico({
      name,
      lastName,
      email,
      phone,
      address,
      city,
      zipCode
    });

    // ✅ CORREGIDO: Usar helper para obtener _id como string
    const userId = getUserId(newUser);

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: userId,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        lastName: newUser.lastName,
        phone: newUser.phone,
        address: newUser.address,
        city: newUser.city,
        zipCode: newUser.zipCode
      }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '5h' }
    );

    return NextResponse.json({ 
      message: 'Usuario registrado', 
      token,
      user: {
        id: userId, // ✅ Usar el id ya convertido
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        lastName: newUser.lastName,
        phone: newUser.phone,
        address: newUser.address,
        city: newUser.city,
        zipCode: newUser.zipCode
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ message: 'Error en el servidor' }, { status: 500 });
  }
}