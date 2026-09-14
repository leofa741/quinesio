'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────
// 🔹 ICONOS MINIMALISTAS (Stroke fino, elegantes)
// ─────────────────────────────────────────────────────────────
const Icons = {
  Heart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  Quote: () => (
    <svg className="w-8 h-8 text-zinc-700" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// 🔹 COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Pequeño delay para que la animación de entrada sea suave al montar
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const timeline = [
    { year: '2015', title: 'El Inicio', desc: 'Comenzamos con una pequeña colección cápsula, enfocada en prendas atemporales y telas de calidad.' },
    { year: '2018', title: 'Crecimiento', desc: 'Expandimos nuestra línea para incluir talles extendidos, reafirmando que la moda es para todos los cuerpos.' },
    { year: '2021', title: 'Nace SG Tu Look', desc: 'Consolidamos nuestra marca con una visión clara: ofrecer estilo, confianza y asesoramiento real.' },
    { year: '2024', title: 'Comunidad', desc: 'Hoy somos una comunidad de miles de clientas que confían en nosotros para brillar en cada ocasión.' },
  ];

  const values = [
    { 
      icon: <Icons.Heart />, 
      title: 'Pasión por el detalle', 
      desc: 'Cada costura, cada tela y cada diseño es elegido pensando en cómo te hará sentir al usarlo.' 
    },
    { 
      icon: <Icons.Sparkles />, 
      title: 'Calidad Premium', 
      desc: 'Trabajamos con proveedores que garantizan durabilidad, confort y terminaciones impecables.' 
    },
    { 
      icon: <Icons.Check />, 
      title: 'Inclusividad Real', 
      desc: 'Creemos en la moda sin límites. Nuestra grilla de talles está pensada para celebrar todas las siluetas.' 
    },
  ];

  const stats = [
    { value: '5K+', label: 'Clientas satisfechas' },
    { value: '100%', label: 'Talles reales' },
    { value: '10', label: 'Años de trayectoria' },
  ];

  const testimonials = [
    { name: 'Valentina M.', role: 'Clienta desde 2022', text: 'La calidad de las prendas es increíble. Por fin encontré un lugar donde los talles son reales y la atención es de primera.' },
    { name: 'Camila R.', role: 'Clienta desde 2023', text: 'Me asesoraron por WhatsApp para elegir mi vestido de graduación. Quedé fascinada con el resultado y la rapidez.' },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-rose-500/30 overflow-x-hidden">
      <br />  <br />  <br />  <br />  <br />
      
      {/* Fondo minimalista: un solo glow muy sutil y difuso */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] right-0 w-[800px] h-[800px] bg-rose-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        
        {/* ═══════════════════════════════════════════════════════
            HERO SECTION - ESENCIA
            ═══════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 sm:mb-32">
          
          {/* Imagen limpia y elegante */}
          <div className={`relative transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
              <Image
                src="/img/logo-oro-removebg-preview.png" // Asegurate de tener esta imagen o cambiá la ruta
                alt="Equipo SG Tu Look"
                fill
                className="object-cover object-top"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
            </div>
            {/* Decoración sutil de esquina */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r border-b border-rose-500/30 rounded-br-2xl hidden sm:block" />
          </div>

          {/* Contenido de texto */}
          <div className={`space-y-8 transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-rose-400 mb-4 block">
                Nuestra Esencia
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white leading-[1.1]">
                Más que una tienda, <br />
                <span className="font-serif italic text-rose-300">un espacio para tu esencia.</span>
              </h1>
            </div>

            <p className="text-lg text-zinc-400 leading-relaxed max-w-lg font-light">
              En <span className="text-zinc-200 font-normal">SG Tu Look</span> creemos que la ropa es una extensión de tu personalidad. 
              Por eso, curamos cada pieza no solo por su estética, sino por la confianza y comodidad que te brinda al usarla.
            </p>

            <ul className="space-y-4 pt-2">
              {[
                'Asesoramiento de imagen personalizado y cercano',
                'Selección exclusiva de telas y diseños de temporada',
                'Compromiso con la inclusividad de talles (XS al XXL)',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-zinc-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Icons.Check />
                  </span>
                  <span className="text-sm sm:text-base font-light">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/productos"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-medium text-sm tracking-wide transition-all duration-300 hover:bg-rose-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Ver Colección</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300"><Icons.ArrowRight /></span>
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-zinc-800 text-zinc-300 font-medium text-sm tracking-wide transition-all duration-300 hover:border-rose-500/50 hover:text-white active:scale-[0.98]"
              >
                <span>Contactanos</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            ESTADÍSTICAS - LIMPIO Y DIRECTO
            ═══════════════════════════════════════════════════════ */}
        <section className="py-12 border-y border-white/5 mb-24 sm:mb-32">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <p className="text-4xl sm:text-5xl font-light text-white tracking-tight">{stat.value}</p>
                <p className="text-sm uppercase tracking-wider text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            HISTORIA (TIMELINE) - MINIMALISTA
            ═══════════════════════════════════════════════════════ */}
        <section className="mb-24 sm:mb-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-rose-400 mb-4 block">Trayectoria</span>
            <h2 className="text-3xl sm:text-4xl font-light text-white">Nuestra historia</h2>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Línea vertical sutil */}
            <div className="absolute left-0 sm:left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2" />
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={index} className={`relative flex flex-col sm:flex-row gap-8 ${index % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
                  {/* Punto en la línea */}
                  <div className="absolute left-0 sm:left-1/2 top-1.5 w-3 h-3 rounded-full bg-zinc-950 border-2 border-rose-500/50 -translate-x-1/2 z-10" />
                  
                  <div className={`sm:w-1/2 ${index % 2 === 0 ? 'sm:pl-12 sm:text-left' : 'sm:pr-12 sm:text-right'} pl-8 sm:pl-0`}>
                    <span className="text-sm font-medium text-rose-400 mb-1 block">{item.year}</span>
                    <h3 className="text-xl font-normal text-white mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed font-light">{item.desc}</p>
                  </div>
                  <div className="hidden sm:block sm:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            VALORES / PILARES
            ═══════════════════════════════════════════════════════ */}
        <section className="mb-24 sm:mb-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-rose-400 mb-4 block">Filosofía</span>
            <h2 className="text-3xl sm:text-4xl font-light text-white">Lo que nos define</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:border-rose-500/30 transition-all duration-500"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 text-rose-400 flex items-center justify-center mb-6 group-hover:bg-rose-500/10 transition-colors duration-300">
                  {value.icon}
                </div>
                <h3 className="text-lg font-normal text-white mb-3">{value.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed font-light">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            TESTIMONIOS - SUTILES
            ═══════════════════════════════════════════════════════ */}
        <section className="mb-24 sm:mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="relative p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="absolute top-6 right-6">
                  <Icons.Quote />
                </div>
                <p className="text-zinc-300 leading-relaxed font-light mb-6 relative z-10 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="text-white font-medium text-sm">{testimonial.name}</p>
                  <p className="text-zinc-500 text-xs">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CTA FINAL - LIMPIO
            ═══════════════════════════════════════════════════════ */}
        <section className="relative rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 sm:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-light text-white">
              ¿Lista para encontrar tu <span className="font-serif italic text-rose-300">look perfecto</span>?
            </h2>
            <p className="text-zinc-400 font-light">
              Escribinos por WhatsApp o visitá nuestro showroom. Estamos para asesorarte y hacer que brilles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="https://wa.me/5491132538837?text=Hola,%20me%20interesa%20consultar%20por%20una%20prenda"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-medium text-sm tracking-wide transition-all duration-300 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icons.Heart />
                <span>Consultar por WhatsApp</span>
              </a>
              <Link
                href="/productos"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-zinc-700 text-zinc-300 font-medium text-sm tracking-wide transition-all duration-300 hover:border-white/50 hover:text-white active:scale-[0.98]"
              >
                <span>Ver Productos</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300"><Icons.ArrowRight /></span>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}