'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────
// 🔹 ICONOS MINIMALISTAS (Salud, movimiento y confianza)
// ─────────────────────────────────────────────────────────────
const Icons = {
  HeartPulse: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  UserMd: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  Quote: () => (
    <svg className="w-8 h-8 text-sky-700/50" fill="currentColor" viewBox="0 0 24 24">
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
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const timeline = [
    { year: '2015', title: 'El Inicio', desc: 'Fundamos el centro en Buenos Aires con una visión clara: brindar rehabilitación kinésica de excelencia con un trato humano y cercano.' },
    { year: '2018', title: 'Crecimiento', desc: 'Expandimos nuestras especialidades incorporando kinesiología deportiva y neurorehabilitación, ampliando nuestra cobertura de obras sociales.' },
    { year: '2021', title: 'Innovación', desc: 'Incorporamos tecnología de vanguardia y protocolos basados en evidencia científica para optimizar los tiempos de recuperación.' },
    { year: '2024', title: 'Referentes Nacionales', desc: 'Hoy somos un centro de referencia en salud kinésica, con una comunidad de pacientes que confían en nuestra identidad y profesionalismo 🇦🇷.' },
  ];

  const values = [
    { 
      icon: <Icons.HeartPulse />, 
      title: 'Práctica Basada en Evidencia', 
      desc: 'Cada protocolo de tratamiento se sustenta en la última evidencia científica, garantizando eficacia y seguridad en tu recuperación.' 
    },
    { 
      icon: <Icons.UserMd />, 
      title: 'Profesionales Matriculados', 
      desc: 'Nuestro equipo está conformado por licenciados en kinesiología con matrícula nacional y formación continua en sus especialidades.' 
    },
    { 
      icon: <Icons.ShieldCheck />, 
      title: 'Gestión Integral de O.S.', 
      desc: 'Nos ocupamos de toda la gestión administrativa y autorizaciones con las principales obras sociales y prepagas del país.' 
    },
  ];

  const stats = [
    { value: '10+', label: 'Años de trayectoria' },
    { value: '15+', label: 'Obras Sociales y Prepagas' },
    { value: '5K+', label: 'Pacientes recuperados' },
  ];

  const testimonials = [
    { name: 'Martín G.', role: 'Paciente - Lesión Deportiva', text: 'Después de mi operación de rodilla, el equipo me devolvió la confianza para volver a correr. La atención es impecable y muy profesional.' },
    { name: 'Laura P.', role: 'Paciente - Rehabilitación de Columna', desc: 'Llegué con mucho dolor de espalda y en pocas sesiones noté la diferencia. La calidez humana y el conocimiento de los profesionales son excepcionales.' },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-sky-500/30 overflow-x-hidden">
      <br /> <br /> <br /> <br /> <br />
      
      {/* Fondo minimalista: glows sutiles con paleta nacional (Celeste/Azul/Ámbar) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] right-0 w-[800px] h-[800px] bg-sky-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
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
                src="/img/Logo-removebg-preview.png" // Asegurate de tener una imagen de tu consultorio/equipo
                alt="Equipo Kinesio.AR"
                fill
                className="object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-medium text-sm tracking-wide">Centro de Kinesiología Integral</p>
                <p className="text-sky-300 text-xs uppercase tracking-wider mt-1">Buenos Aires, Argentina 🇦🇷</p>
              </div>
            </div>
            {/* Decoración sutil de esquina */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r border-b border-sky-500/30 rounded-br-2xl hidden sm:block" />
          </div>

          {/* Contenido de texto */}
          <div className={`space-y-8 transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400 mb-4 block">
                Nuestra Esencia
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white leading-[1.1]">
                Más que un consultorio, <br />
                <span className="font-serif italic text-sky-300">un espacio para tu recuperación.</span>
              </h1>
            </div>

            <p className="text-lg text-zinc-400 leading-relaxed max-w-lg font-light">
              En <span className="text-zinc-200 font-normal">Kinesio.AR</span> creemos que la salud es el fundamento de tu libertad. 
              Combinamos la excelencia profesional con la calidez humana, ofreciendo tratamientos personalizados con identidad y orgullo argentino.
            </p>

            <ul className="space-y-4 pt-2">
              {[
                'Evaluación kinésica integral y planes de tratamiento a medida',
                'Tecnología de vanguardia y prácticas basadas en evidencia',
                'Gestión completa de autorizaciones con todas las obras sociales',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-zinc-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Icons.ShieldCheck />
                  </span>
                  <span className="text-sm sm:text-base font-light">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/servicios"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-medium text-sm tracking-wide transition-all duration-300 hover:bg-sky-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Nuestras Especialidades</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300"><Icons.ArrowRight /></span>
              </Link>
              <Link
                href="/contacto"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-zinc-800 text-zinc-300 font-medium text-sm tracking-wide transition-all duration-300 hover:border-sky-500/50 hover:text-white active:scale-[0.98]"
              >
                <span>Consultar por mi Obra Social</span>
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
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400 mb-4 block">Trayectoria</span>
            <h2 className="text-3xl sm:text-4xl font-light text-white">Nuestra historia</h2>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Línea vertical sutil */}
            <div className="absolute left-0 sm:left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2" />
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={index} className={`relative flex flex-col sm:flex-row gap-8 ${index % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
                  {/* Punto en la línea */}
                  <div className="absolute left-0 sm:left-1/2 top-1.5 w-3 h-3 rounded-full bg-zinc-950 border-2 border-sky-500/50 -translate-x-1/2 z-10" />
                  
                  <div className={`sm:w-1/2 ${index % 2 === 0 ? 'sm:pl-12 sm:text-left' : 'sm:pr-12 sm:text-right'} pl-8 sm:pl-0`}>
                    <span className="text-sm font-medium text-sky-400 mb-1 block">{item.year}</span>
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
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400 mb-4 block">Filosofía</span>
            <h2 className="text-3xl sm:text-4xl font-light text-white">Lo que nos define</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:border-sky-500/30 transition-all duration-500"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 text-sky-400 flex items-center justify-center mb-6 group-hover:bg-sky-500/10 transition-colors duration-300">
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
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400 mb-4 block">Testimonios</span>
            <h2 className="text-3xl sm:text-4xl font-light text-white">La voz de nuestros pacientes</h2>
          </div>
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
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-light text-white">
              ¿Listo para recuperar tu <span className="font-serif italic text-sky-300">movimiento</span>?
            </h2>
            <p className="text-zinc-400 font-light">
              Escribinos por WhatsApp para consultar por tu obra social o para agendar tu primera evaluación kinésica. Estamos para acompañarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="https://wa.me/5491141461312?text=Hola,%20me%20interesa%20consultar%20por%20un%20turno%20o%20mi%20obra%20social"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-medium text-sm tracking-wide transition-all duration-300 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icons.HeartPulse />
                <span>Consultar por WhatsApp</span>
              </a>
              <Link
                href="/servicios"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-zinc-700 text-zinc-300 font-medium text-sm tracking-wide transition-all duration-300 hover:border-white/50 hover:text-white active:scale-[0.98]"
              >
                <span>Ver Especialidades</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300"><Icons.ArrowRight /></span>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}