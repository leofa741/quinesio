'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { FaStar, FaArrowRight, FaHeartbeat, FaUserMd, FaWhatsapp, FaSearch, FaHospital, FaShieldAlt } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import VideoHero from './components/ui/VideoHero';
// ─────────────────────────────────────────────────────────────
// 🔹 Tipos para CENTRO DE KINESIOLOGÍA
// ─────────────────────────────────────────────────────────────
interface Servicio {
  _id: string;
  nombre: string;
  descripcion: string;
  categoria: 'rehabilitacion' | 'deportiva' | 'pilates' | 'masoterapia' | 'neurologica';
  precioParticular: number;
  requiereOrdenMedica: boolean;
  imagen: string;
  slug: string;
  destacado: boolean;
  obrasSocialesAceptadas: string[];
}

interface Especialidad {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

// ─────────────────────────────────────────────────────────────
// 🔹 Helpers de formato (Hardcodeado para evitar fallos externos)
// ─────────────────────────────────────────────────────────────
const formatPrice = (monto: number) => {
  return `$ ${monto.toLocaleString('es-AR')}`;
};

// ─────────────────────────────────────────────────────────────
// 🔹 Componentes de Loading LOCAL
// ─────────────────────────────────────────────────────────────
function ServicesSectionLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50">
            <div className="aspect-[3/4] bg-slate-700/50" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-700/50 rounded w-3/4" />
              <div className="h-3 bg-slate-700/50 rounded w-1/2" />
              <div className="h-8 bg-slate-700/50 rounded w-1/3 mt-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal
// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return <PageContent />;
}

function PageContent() {
  // ✅ Estados para KINESIOLOGÍA
  const [featuredServices, setFeaturedServices] = useState<Servicio[]>([]);
  const [allServices, setAllServices] = useState<Servicio[]>([]);
  
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedService, setSelectedService] = useState<Servicio | null>(null);

  // Efecto para el mouse move del background
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const move = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty('--x', `${x}px`);
      container.style.setProperty('--y', `${y}px`);
    };
    container.addEventListener('mousemove', move);
    return () => container.removeEventListener('mousemove', move);
  }, []);

  // 📥 Cargar datos HARDCODEADOS (SIN API, SIN FETCH, SIN NEXT-AUTH)
  useEffect(() => {
    console.log("🚀 Cargando datos locales (sin API)");
    
    const timer = setTimeout(() => {
      const mockServicios: Servicio[] = [
        {
          _id: '1',
          nombre: 'Rehabilitación de Columna',
          descripcion: 'Tratamiento especializado para hernias discales, lumbalgias y cervicalgias con tecnología de vanguardia.',
          categoria: 'rehabilitacion',
          precioParticular: 15000,
          requiereOrdenMedica: true,
          imagen: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
          slug: 'rehabilitacion-columna',
          destacado: true,
          obrasSocialesAceptadas: ['OSDE', 'PAMI', 'Swiss Medical', 'Galeno']
        },
        {
          _id: '2',
          nombre: 'Kinesiología Deportiva',
          descripcion: 'Readaptación al esfuerzo, prevención de lesiones y recuperación post-competencia para atletas.',
          categoria: 'deportiva',
          precioParticular: 18000,
          requiereOrdenMedica: false,
           imagen: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800',
          slug: 'kinesiologia-deportiva',
          destacado: true,
          obrasSocialesAceptadas: ['OSDE', 'Medifé', 'Particular']
        },
        {
          _id: '3',
          nombre: 'Pilates Reformer',
          descripcion: 'Clases personalizadas para fortalecimiento del core, postura y flexibilidad en grupo reducido.',
          categoria: 'pilates',
          precioParticular: 12000,
          requiereOrdenMedica: false,
          imagen: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800',
          slug: 'pilates-reformer',
          destacado: false,
          obrasSocialesAceptadas: ['Particular']
        },
        {
          _id: '4',
          nombre: 'Masoterapia Descontracturante',
          descripcion: 'Terapia manual profunda para aliviar tensiones musculares, estrés y contracturas crónicas.',
          categoria: 'masoterapia',
          precioParticular: 14000,
          requiereOrdenMedica: false,
          imagen: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
          slug: 'masoterapia-descontracturante',
          destacado: true,
          obrasSocialesAceptadas: ['OSPE', 'Sancor Salud', 'Particular']
        },
        {
          _id: '5',
          nombre: 'Rehabilitación Neurológica',
          descripcion: 'Tratamiento para pacientes con ACV, Parkinson o lesiones medulares para recuperar la movilidad.',
          categoria: 'neurologica',
          precioParticular: 20000,
          requiereOrdenMedica: true,
            imagen: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800',
          slug: 'rehabilitacion-neurologica',
          destacado: false,
          obrasSocialesAceptadas: ['PAMI', 'IOMA', 'OSDE']
        }
      ];

      setFeaturedServices(mockServicios.filter(s => s.destacado));
      setAllServices(mockServicios);
      setFeaturedLoading(false);
      setServicesLoading(false);
      
      console.log("✅ Datos locales cargados exitosamente");
    }, 800); // Simula 800ms de carga para ver el skeleton

    return () => clearTimeout(timer);
  }, []);

  // 🔍 Búsqueda local en frontend
  const filteredServices = allServices.filter(serv =>
    searchQuery === '' ||
    serv.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    serv.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Especialidades 
  const especialidades: Especialidad[] = [
    { slug: 'columna', name: 'Columna y Raquis', description: 'Hernias, lumbalgias y cervicalgias', icon: '🦴' },
    { slug: 'miembro-superior', name: 'Miembro Superior', description: 'Hombro, codo, muñeca y mano', icon: '💪' },
    { slug: 'miembro-inferior', name: 'Miembro Inferior', description: 'Rodilla, cadera, tobillo y pie', icon: '🦵' },
    { slug: 'deportiva', name: 'Kinesiología Deportiva', description: 'Prevención y readaptación al deporte', icon: '🏃' },
  ];

  // Obras sociales
  const obrasSociales = ['OSDE', 'Swiss Medical', 'PAMI', 'Galeno', 'OSPE', 'Sancor Salud', 'Medifé', 'OSDEPyM'];

  // ─────────────────────────────────────────────────────────────
  // 🔹 Componente reutilizable de beneficio
  // ─────────────────────────────────────────────────────────────
  const BenefitCard = ({
    icon, title, description, delay, accent = "from-sky-400 to-blue-500"
  }: {
    icon: React.ReactNode; title: string; description: string; delay: number; accent?: string;
  }) => (
    <div
      className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-sky-500/30 transition-all duration-500 animate-fadeInUp"
      style={{ animationDelay: `${delay + 200}ms` }}
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${accent} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-lg -z-10 pointer-events-none`} />
      <div className="absolute inset-[1px] rounded-2xl bg-slate-900/90 -z-10" />
      <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${accent} bg-opacity-10 flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300`}>
        <span className="text-white">{icon}</span>
      </div>
      <h3 className="relative text-lg font-semibold text-white mb-2 group-hover:text-sky-300 transition-colors duration-300">{title}</h3>
      <p className="relative text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">{description}</p>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // 🔹 Service Card Inline
  // ─────────────────────────────────────────────────────────────
  const ServiceCard = ({ service }: { service: Servicio }) => (
    <div className="group relative bg-slate-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-sky-500/30 transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image 
          src={service.imagen || '/img/kine-default.jpg'} 
          alt={service.nombre} 
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        {service.destacado && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-sky-500/90 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-lg">
            Destacado
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <button 
            onClick={() => setSelectedService(service)}
            className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-sky-100 transition-colors shadow-lg"
          >
            Ver Detalles y Cobertura
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold truncate mb-1">{service.nombre}</h3>
        <p className="text-slate-400 text-xs mb-3 capitalize">{service.categoria.replace('-', ' ')}</p>
        <div className="flex items-center justify-between">
          <span className="text-sky-400 font-bold text-sm">
            {service.requiereOrdenMedica ? 'Con Orden Médica' : 'Particular'}
          </span>
          <span className="text-slate-500 text-xs bg-white/5 px-2 py-1 rounded flex items-center gap-1">
            <FaShieldAlt className="text-emerald-400 text-[10px]" />
            {service.obrasSocialesAceptadas.length} O.S.
          </span>
        </div>
      </div>
    </div>
  );

  // ✅ Render principal
  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-white">
      <div className="relative w-full left-0 right-0">
        <VideoHero videoSrc="/videos/quinesio.mp4" overlayOpacity={0.5}>
          <div className="max-w-7xl mx-auto px-6 pt-40 sm:pt-48">
            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-8 items-center">
              <div className="hidden lg:flex justify-center">
                <div 
                  className="text-white font-black uppercase leading-none tracking-tight text-5xl opacity-90 mr-10 mt-2"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  KineSalud AR
                </div>
              </div>
              <div className="text-left">
                <div className="space-y-2">
                  <div className="group relative inline-block overflow-hidden rounded-2xl">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] transition-opacity duration-500" />
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-2xl" />
                    <h1 className="relative z-10 text-4xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tight text-white/60 group-hover:text-white/90 group-hover:[text-shadow:0_0_30px_rgba(56,189,248,0.15)] transition-all duration-500 ease-out selection:bg-sky-500/20 rounded-2xl">
                      Recuperá tu movimiento,
                      <div>recuperá tu vida.</div>  
                    </h1>
                  </div>
                </div>
                <div className="mt-10 border-t border-white/30 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase flex items-center gap-3">
                      Centro de Kinesiología
                      <span className="text-2xl">🇦🇷</span>
                    </h2>
                    <p className="mt-2 text-sm md:text-lg uppercase tracking-wider text-gray-300">
                      Buenos Aires, Argentina · Atención de Lunes a Sábados
                    </p>
                  </div>
                  <a href="/turnos" className="inline-flex items-center justify-center px-8 py-4 bg-sky-500 text-slate-950 font-bold uppercase tracking-wide hover:bg-sky-400 transition-all duration-300 rounded-full shadow-lg shadow-sky-500/20">
                    Solicitar Turno
                  </a>
                </div>
              </div>
            </div>
          </div>
        </VideoHero>
      </div>

      {/* BANNER OBRAS SOCIALES */}
      <section className="relative py-6 bg-sky-900/20 border-y border-sky-500/20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.1),transparent)] animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-slate-300 font-semibold tracking-wide text-sm sm:text-base uppercase">
          <span className="text-sky-400 flex items-center gap-2"><FaShieldAlt /> Trabajamos con:</span>
          {obrasSociales.map((os, i) => (
            <span key={i} className="hover:text-white transition-colors cursor-default">{os}</span>
          ))}
        </div>
      </section>

      {/* SECCIÓN BENEFICIOS */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-r from-sky-500/10 via-blue-500/15 to-cyan-500/10 opacity-60" style={{ filter: 'blur(120px)' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-blue-500/10 opacity-40" style={{ filter: 'blur(100px)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 animate-fadeInUp">
            <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-400/20 backdrop-blur-sm mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gradient-to-r from-sky-400 to-blue-400" />
              </span>
              <span className="text-[11px] tracking-[0.3em] uppercase bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent font-semibold">
                Impronta Nacional
              </span>
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-sky-100 to-white bg-clip-text text-transparent">Salud con</span>
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-sky-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent italic font-serif"> Identidad Argentina</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto px-2">
              Un equipo de profesionales matriculados comprometidos con tu recuperación. 
              <span className="block sm:inline"> Tecnología de vanguardia y </span>
              <span className="bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent font-semibold">calidez humana</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <BenefitCard icon={<FaHospital className="w-6 h-6" />} title="Todas las Obras Sociales" description="Trabajamos con los principales prestadores del país. Gestionamos tu autorización para que solo te preocupes por sanar." accent="from-sky-400 to-blue-500" delay={0} />
            <BenefitCard icon={<FaUserMd className="w-6 h-6" />} title="Profesionales Matriculados" description="Licenciados en Kinesiología con matrícula nacional y amplia experiencia en rehabilitación y prevención." accent="from-blue-400 to-cyan-500" delay={100} />
            <BenefitCard icon={<FaHeartbeat className="w-6 h-6" />} title="Práctica Basada en Evidencia" description="Utilizamos protocolos actualizados y tecnología de última generación para garantizar los mejores resultados." accent="from-emerald-400 to-teal-500" delay={200} />
            <BenefitCard icon={<FaShieldAlt className="w-6 h-6" />} title="Trato Humano y Personalizado" description="Cada paciente es único. Diseñamos planes de tratamiento a medida, con seguimiento continuo de tu evolución." accent="from-cyan-400 to-sky-500" delay={300} />
          </div>

          <div className="text-center mt-14 sm:mt-20 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
            <a href="/servicios" className="group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-full font-semibold text-sm tracking-wide transition-all duration-500 overflow-hidden bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-2xl hover:shadow-sky-500/40 hover:scale-[1.03] active:scale-[0.98]">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="absolute inset-0 rounded-full border border-white/25 group-hover:border-white/50 transition-colors duration-300" />
              <span className="relative z-10">Conocer Nuestros Servicios</span>
              <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <p className="mt-5 text-xs text-slate-500 tracking-wide">🇦🇷 Orgullosamente al servicio de la salud argentina</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN VALOR */}
      <section className="relative -mt-16 sm:-mt-20 py-20 sm:py-24 lg:py-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-r from-sky-500/10 via-blue-500/15 to-cyan-500/10 opacity-60" style={{ filter: 'blur(120px)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="lg:w-1/2 space-y-6 sm:space-y-8 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-400/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-sky-400 to-blue-400" />
                </span>
                <span className="text-[11px] tracking-[0.3em] uppercase bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent font-semibold">
                  Tu Centro de Confianza
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-sky-100 to-white bg-clip-text text-transparent">Recuperación</span>
                <br />
                <span className="bg-gradient-to-r from-sky-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent italic font-serif">Integral y Efectiva</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl px-2">
                Instalaciones <span className="text-white font-medium">modernas</span>, <span className="text-white font-medium">accesibilidad garantizada</span> y un enfoque centrado en el paciente. 
                Te acompañamos en cada paso de tu rehabilitación.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: '✦', label: 'Gestión integral de autorizaciones con tu obra social', color: 'from-sky-400 to-blue-500' },
                  { icon: '✦', label: 'Sesiones individuales y de rehabilitación grupal', color: 'from-blue-400 to-cyan-500' },
                  { icon: '✦', label: 'Convenios con empresas y clubes deportivos', color: 'from-emerald-400 to-teal-500' },
                ].map((feature, index) => (
                  <li key={index} className="group flex items-start gap-4 animate-fadeInUp" style={{ animationDelay: `${200 + index * 100}ms` }}>
                    <span className={`relative flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-sky-900/30 group-hover:shadow-sky-900/50 transition-shadow duration-300`}>
                      {feature.icon}
                      <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </span>
                    <span className="text-slate-300 group-hover:text-white transition-colors duration-300 pt-0.5">{feature.label}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <a href="/servicios" className="group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-full font-semibold text-sm tracking-wide transition-all duration-500 overflow-hidden bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-2xl hover:shadow-sky-500/40 hover:scale-[1.03] active:scale-[0.98]">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="absolute inset-0 rounded-full border border-white/25 group-hover:border-white/50 transition-colors duration-300" />
                  <span className="relative z-10">Ver Especialidades</span>
                  <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a href="/contacto" className="group relative inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-4 sm:py-5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/40 text-white backdrop-blur-sm active:scale-[0.98]">
                  <span>Consultar por mi Obra Social</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="lg:w-1/2 flex justify-center lg:justify-end animate-fadeInUp" style={{ animationDelay: '300ms' }}>
              <div className="relative group w-full max-w-md">
                <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-sky-500/30 via-blue-500/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 rounded-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 blur-sm pointer-events-none" />
               
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-2 sm:p-3 border border-white/10 shadow-2xl shadow-sky-900/30 group-hover:shadow-sky-900/50 transition-all duration-500 group-hover:scale-[1.01]">
                  <div className="flex items-center justify-between px-3 py-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80" />
                      </div>
                      <span className="text-[10px] text-slate-500 tracking-wider ml-2 font-mono">servicio-destacado</span>
                    </div>
                    <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/30">
                      <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
                      <span className="text-[9px] font-semibold text-sky-300 tracking-wider uppercase">Con Cobertura</span>
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-xl aspect-[4/5]">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10 pointer-events-none" />
                    <Image
                      src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800"
                      alt="Rehabilitación Kinésica Integral"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      width={780}
                      height={975}
                      priority
                    />
                    <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between gap-2">
                      <div className="px-3 py-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10">
                        <span className="text-sm font-bold text-white">Rehabilitación Integral</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Post-quirúrgica y Traumática</span>
                      </div>
                      <button className="group/btn flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-sky-500/30">
                        <span className="text-[10px] font-semibold text-white tracking-wider uppercase">Ver más</span>
                        <svg className="w-3 h-3 text-white transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-3 group-hover:text-sky-300 transition-colors duration-300">Rehabilitación Kinésica Integral</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                        <FaUserMd className="w-4 h-4 text-sky-400" />
                        <span className="text-[10px] font-semibold text-white">1 a 1</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Sesión</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                        <FaShieldAlt className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-semibold text-white">+15</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">O.S.</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300">
                        <FaHeartbeat className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-semibold text-white">45 min</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Duración</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <br />

      {/* SERVICIOS DESTACADOS */}
      <section className="py-12 sm:py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FaStar className="text-sky-400" />
                Servicios Destacados
              </h2>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">Las especialidades más solicitadas por nuestros pacientes</p>
            </div>
            <Link href="/servicios?destacado=true" className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-2 text-sm sm:text-base">
              Ver todas <FaArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredLoading ? (
            <ServicesSectionLoader />
          ) : featuredServices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FaHospital className="text-4xl mb-3 mx-auto opacity-50" />
              <p>No hay servicios destacados en este momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredServices.map((serv) => (
                <ServiceCard key={serv._id} service={serv} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* EXPLORAR POR ESPECIALIDAD */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">Nuestras Especialidades</h2>
            <p className="text-slate-400 max-w-2xl mx-auto px-2 text-sm sm:text-base">Encontrá el tratamiento adecuado para tu necesidad con profesionales expertos en cada área</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {especialidades.map((esp) => (
              <Link key={esp.slug} href={`/servicios?especialidad=${esp.slug}`} className="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/50 hover:border-sky-500/40 hover:bg-slate-800/90 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl sm:text-3xl">{esp.icon}</span>
                </div>
                <h3 className="text-white font-semibold group-hover:text-sky-400 transition-colors text-sm sm:text-base mb-1">{esp.name}</h3>
                <p className="text-slate-500 text-xs group-hover:text-slate-400 transition-colors">{esp.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LISTADO GENERAL DE SERVICIOS */}
      <section className="py-12 sm:py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Todos los Servicios</h2>
              <p className="text-slate-400 mt-2 text-sm">
                {servicesLoading ? 'Cargando...' : `${filteredServices.length} servicio${filteredServices.length !== 1 ? 's' : ''} disponible${filteredServices.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Link href="/servicios" className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium transition-all shadow-lg shadow-sky-900/30 text-sm">
              <FaSearch className="w-4 h-4" />
              Ver todos los filtros
            </Link>
          </div>

          {servicesLoading ? (
            <ServicesSectionLoader />
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FaSearch className="text-4xl mb-3 mx-auto opacity-50" />
              <p>{searchQuery ? `No se encontraron servicios para "${searchQuery}"` : 'No hay servicios disponibles'}</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-4 text-sky-400 hover:text-sky-300 font-medium text-sm">Limpiar búsqueda</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredServices.slice(0, 6).map((serv) => (
                <ServiceCard key={serv._id} service={serv} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:mt-10">
            <Link href="/servicios" className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-sky-500/40 hover:text-white transition-all font-medium text-sm">
              Ver más servicios <FaArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">¿Tenés dudas sobre tu cobertura o necesitás un turno?</h2>
          <p className="text-base sm:text-xl text-slate-400 mb-8 sm:mb-10 px-2">Nuestro equipo administrativo te ayuda a gestionar tu autorización y a encontrar el horario que mejor se adapte a vos.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a href="https://wa.me/5491132538837?text=Hola,%20me%20interesa%20consultar%20por%20un%20servicio%20y%20necesito%20información%20sobre%20mi%20obra%20social" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-lg shadow-emerald-900/30 text-sm">
              <FaWhatsapp className="w-4 h-4 sm:w-5 h-5" /> Consultar por WhatsApp
            </a>
            <Link href="/contacto" className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-sky-500/40 hover:text-white transition-all font-semibold text-sm">
              Enviar consulta por mail
            </Link>
          </div>
        </div>
      </section>

      {/* MODAL DE SERVICIO */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedService(null)}>
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-sky-900/50" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80" />
                </div>
                <span className="text-[10px] text-slate-500 tracking-wider ml-2 font-mono">vista-rapida-servicio</span>
              </div>
              <button onClick={() => setSelectedService(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-2">
              <div className="relative aspect-square md:aspect-auto">
                <Image src={selectedService.imagen || '/img/kine-default.jpg'} alt={selectedService.nombre} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:hidden" />
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <span className="text-xs text-sky-400 uppercase tracking-wider font-semibold">{selectedService.categoria.replace('-', ' ')}</span>
                  <h2 className="text-2xl font-bold text-white mt-1 mb-2">{selectedService.nombre}</h2>
                  {selectedService.precioParticular > 0 && (
                    <p className="text-xl font-bold text-sky-400">Particular: {formatPrice(selectedService.precioParticular)}</p>
                  )}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">{selectedService.descripcion}</p>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Requiere Orden Médica</span>
                    <p className="text-base font-semibold text-white flex items-center gap-2">
                      {selectedService.requiereOrdenMedica ? (
                        <><FaShieldAlt className="text-emerald-400" /> Sí, es necesaria para la cobertura</>
                      ) : (
                        <><span className="text-sky-400">No requerida</span> para atención particular</>
                      )}
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Obras Sociales Aceptadas</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedService.obrasSocialesAceptadas.map((os, i) => (
                        <span key={i} className="text-[10px] font-semibold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">{os}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <a href={`https://wa.me/5491132538837?text=${encodeURIComponent(`Hola, me interesa el servicio: ${selectedService.nombre}. ¿Podrían indicarme la cobertura con mi obra social?`)}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/30 inline-flex items-center justify-center gap-2">
                  <FaWhatsapp className="w-5 h-5" /> Consultar Turno y Cobertura
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}