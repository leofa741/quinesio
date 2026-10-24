import mongoose from 'mongoose';

// 1. Definimos la interfaz exacta del caché global
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// 2. Extendemos el objeto global de Node.js para incluir nuestro caché
declare global {
  var mongoose: MongooseCache | undefined;
}

// 3. Inicializamos el caché de forma segura con la interfaz
const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // 4. Si ya existe una conexión, la retornamos INMEDIATAMENTE (0 ms de espera)
  if (cached.conn) {
    return cached.conn;
  }

  // 5. Si no hay promesa de conexión, la creamos
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Evita que Mongoose ponga en cola operaciones si se cae la BD
    };

    // Forzamos el tipado de la URL para evitar errores de TS si dotenv no la cargó a tiempo
    const mongoUri = process.env.MONGODB_CNN as string;

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB conectado exitosamente');
      return mongooseInstance;
    });
  }

  // 6. Esperamos a que la conexión se establezca
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Si falla, limpiamos la promesa para que el próximo intento pueda reintentar
    cached.promise = null;
    console.error('❌ Error al conectar MongoDB:', e);
    throw e; // Lanzamos el error para que la ruta API lo capture y devuelva un 500 limpio
  }

  return cached.conn;
}

export default connectDB;