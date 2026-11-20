'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaArrowRight, FaWhatsapp } from 'react-icons/fa';
import VideoHero from './components/ui/VideoHero';
import { siteConfig } from '@/app/lib/config/site';

// ─────────────────────────────────────────────────────────────
// 🔹 Tipos (Mantenidos para compatibilidad)
// ─────────────────────────────────────────────────────────────
interface Servicio {
  _id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  slug: string;
  destacado: boolean;
}

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal Minimalista
// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [featuredServices, setFeaturedServices] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulación de carga de datos (puedes conectarlo a tu API después)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFeaturedServices([
        { _id: '1', nombre: 'Rehabilitación de Columna', descripcion: 'Hernias, lumbalgias y cervicalgias.', categoria: 'Rehabilitación', slug: 'columna', destacado: true },
        { _id: '2', nombre: 'Kinesiología Deportiva', descripcion: 'Readaptación al esfuerzo y prevención.', categoria: 'Deportiva', slug: 'deportiva', destacado: true },
        { _id: '3', nombre: 'Pilates Reformer', descripcion: 'Fortalecimiento del core y postura.', categoria: 'Pilates', slug: 'pilates', destacado: true },
      ]);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-sky-500/30">
      
      {/* 1. HERO: Limpio, centrado y sin distracciones */}
      <div className="relative w-full">
        <VideoHero videoSrc="/videos/quinesio.mp4" overlayOpacity={0.65}>
          <div className="max-w-4xl mx-auto px-6 pt-48 pb-32 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-tight mb-6">
              Recuperá tu movimiento. <br />
              <span className="font-medium text-sky-400">Recuperá tu vida.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
              Centro de Kinesiología y Rehabilitación en Buenos Aires. 
              Atención profesional, personalizada y basada en evidencia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-3.5 bg-white text-slate-950 rounded-full font-medium hover:bg-sky-50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Solicitar Turno
                <FaArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#intro"
                className="px-8 py-3.5 border border-white/20 text-white rounded-full font-medium hover:bg-white/10 transition-all duration-300"
              >
                Conocer el Centro
              </Link>
            </div>
          </div>
        </VideoHero>
      </div>

      {/* 2. INTRODUCCIÓN BREVE (El núcleo de tu pedido) */}
      <section id="intro" className="py-24 md:py-32 bg-slate-950 border-b border-slate-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-[0.2em] mb-6 block">
            Sobre Nosotros
          </span>
          <h2 className="text-2xl md:text-4xl font-light text-white leading-relaxed mb-8">
            Somos un equipo de profesionales matriculados dedicados a tu rehabilitación integral. 
            Combinamos <span className="text-sky-400 font-normal">tecnología de vanguardia</span> con un trato humano y cercano, 
            gestionando tu autorización con todas las obras sociales para que tu única preocupación sea sanar.
          </h2>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-2">🇦🇷 Buenos Aires, Argentina</span>
            <span className="flex items-center gap-2">🕒 Lunes a Sábados: 8 a 20 hs</span>
            <span className="flex items-center gap-2">🏥 Todas las Obras Sociales</span>
          </div>
        </div>
      </section>

      {/* 3. SERVICIOS DESTACADOS (Versión ultra-minimalista) */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-[0.2em] mb-2">Especialidades</h3>
              <h2 className="text-3xl md:text-4xl font-light text-white">Tratamientos Destacados</h2>
            </div>
            <Link href="/servicios" className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              Ver todos <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-900 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-900 border border-slate-900 rounded-2xl overflow-hidden">
              {featuredServices.map((serv) => (
                <Link 
                  key={serv._id} 
                  href={`/servicios/${serv.slug}`}
                  className="group relative bg-slate-950 p-8 hover:bg-slate-900 transition-colors duration-300 flex flex-col justify-between h-full min-h-[200px]"
                >
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider mb-3 block">{serv.categoria}</span>
                    <h4 className="text-xl text-white font-medium mb-2 group-hover:text-sky-400 transition-colors">{serv.nombre}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{serv.descripcion}</p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sky-400 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Ver detalles <FaArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/servicios" className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2">
              Ver todos los servicios <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CTA FINAL (Simple y directo) */}
      <section className="py-24 bg-slate-900/30 border-t border-slate-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">¿Tenés dudas sobre tu cobertura?</h2>
          <p className="text-slate-400 mb-10 text-lg font-light">
            Nuestro equipo administrativo te ayuda a gestionar tu autorización y a encontrar el horario que mejor se adapte a vos.
          </p>
          <a 
            href={`https://wa.me/${siteConfig.contact.whatsappNumber}?text=${encodeURIComponent(siteConfig.contact.whatsappMessage)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium transition-all duration-300 shadow-lg shadow-emerald-900/20"
          >
            <FaWhatsapp className="w-5 h-5" />
            Consultar por WhatsApp
          </a>
        </div>
      </section>

      
    </div>
  );
}