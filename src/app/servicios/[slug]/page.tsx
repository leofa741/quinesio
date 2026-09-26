import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/app/lib/mongoose';
import Especialidad, { IEspecialidad } from '@/app/models/Especialidad';

interface Props {
  params: Promise<{ slug: string }>; 
}

type EspecialidadLean = Omit<IEspecialidad, 'createdAt' | 'updatedAt'> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

async function getEspecialidadBySlug(slug: string): Promise<EspecialidadLean | null> {
  try {
    await connectDB();
    const especialidad = await Especialidad.findOne({ slug: slug, isActive: true }).lean() as EspecialidadLean | null;
    return especialidad;
  } catch (error) {
    console.error('Error al obtener especialidad:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; 
  const especialidad = await getEspecialidadBySlug(slug);
  
  if (!especialidad) {
    return { title: 'Especialidad no encontrada | Kinesio.AR' };
  }

  return {
    title: `${especialidad.name.charAt(0).toUpperCase() + especialidad.name.slice(1)} - Kinesio.AR`,
    description: especialidad.description,
  };
}

export default async function EspecialidadPage({ params }: Props) {
  const { slug } = await params; 
  const especialidad = await getEspecialidadBySlug(slug);

  if (!especialidad) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* 🌟 Hero Section CON IMAGEN DE FONDO 🌟 */}
      <div className="relative h-[500px]  mt-40 flex items-center justify-center overflow-hidden">
        {/* 1. Imagen de fondo si existe */}
        {especialidad.image && (
          <img 
            src={especialidad.image} 
            alt={especialidad.name} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* 2. Overlay oscuro degradado para que el texto sea siempre legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
        
        {/* 3. Contenido del Hero */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 capitalize drop-shadow-lg">
            {especialidad.name}
          </h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            {especialidad.description}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Info Card */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-sky-500 rounded-full"></span>
                Sobre esta especialidad
              </h2>
              
              <p className="text-slate-300 leading-relaxed mb-8 whitespace-pre-line text-lg">
                {especialidad.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 rounded-xl p-6 text-center border border-slate-700">
                  <div className="text-4xl font-bold text-sky-400 mb-2">
                    {especialidad.count || 0}
                  </div>
                  <div className="text-sm text-slate-400 uppercase tracking-wide">Servicios disponibles</div>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-6 text-center border border-slate-700">
                  <div className="text-4xl font-bold text-amber-400 mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-slate-400 uppercase tracking-wide">Disponibilidad</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-8 text-white sticky top-24 shadow-xl shadow-sky-900/20">
              <h3 className="text-xl font-bold mb-4">
                ¿Necesitás esta especialidad?
              </h3>
              <p className="text-sm mb-6 opacity-90 leading-relaxed">
                Contactanos para más información o para agendar un turno con nuestros profesionales.
              </p>
              <a
                href="/contact"
                className="block w-full bg-white text-sky-600 font-bold py-3.5 rounded-xl text-center hover:bg-slate-100 transition-all duration-300 hover:scale-[1.02]"
              >
                Contactar ahora
              </a>
              <a
                href="https://wa.me/5491111223344"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full mt-3 bg-transparent border-2 border-white text-white font-bold py-3.5 rounded-xl text-center hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
              >
                WhatsApp
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}