'use client';

import { useState, useCallback } from 'react';


// ─────────────────────────────────────────────────────────────
// 🔹 Iconos Minimalistas
// ─────────────────────────────────────────────────────────────
const Icons = {
  Mail: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  WhatsApp: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  MapPin: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  )
};

export default function Contact() {
  // ✅ Estado del formulario
  const [form, setForm] = useState({ name: '', contact: '', interest: 'general', message: '' });
  // ✅ Estado para saber qué campos tocó el usuario (para mostrar bordes rojos)
  const [touched, setTouched] = useState({ name: false, contact: false, message: false });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const whatsappNumber = '5491141461312';
  const whatsappMessage = 'Hola, me interesa consultar por un turno o servicio kinésico';

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
    setTouched(prev => ({ ...prev, [id]: true }));
    if (status.type === 'error') setStatus({ type: '', message: '' });
  }, [status.type]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    setTouched({ name: true, contact: true, message: true });

    const nameVal = (form.name || '').trim();
    const contactVal = (form.contact || '').trim();
    const messageVal = (form.message || '').trim();

    if (!nameVal || !contactVal || !messageVal) {
      setStatus({ 
        type: 'error', 
        message: 'Por favor, completá los campos obligatorios (Nombre, Contacto y Mensaje).' 
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          subject: `Consulta Web - ${form.interest === 'general' ? 'General' : form.interest}` 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: '¡Mensaje enviado! Nos pondremos en contacto a la brevedad.' });
        setForm({ name: '', contact: '', interest: 'general', message: '' });
        setTouched({ name: false, contact: false, message: false });
      } else {
        setStatus({ type: 'error', message: data.message || 'Hubo un error. Inténtalo por WhatsApp.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error de conexión. Intentá por WhatsApp.' });
    } finally {
      setLoading(false);
    }
  }, [form]);

  // Helper para clases dinámicas de los inputs (Celeste en foco, rojo en error)
  const getInputClass = (fieldName: 'name' | 'contact' | 'message') => {
    const isInvalid = touched[fieldName] && !(form[fieldName] || '').trim();
    return `w-full bg-transparent border-b py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors duration-300 text-base ${
      isInvalid 
        ? 'border-red-500 focus:border-red-500' 
        : 'border-zinc-800 focus:border-sky-400'
    }`;
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-sky-500/30">
      
      {/* Fondo minimalista con paleta nacional (Celeste/Azul/Ámbar) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        
        {/* ───────── HEADER MINIMALISTA ───────── */}
        <div className="max-w-2xl mb-16 sm:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white mb-6">
            Hablemos de <span className="font-serif italic text-sky-300">tu recuperación</span>.
          </h1>
          <p className="text-lg text-zinc-400 font-light leading-relaxed max-w-xl">
            ¿Tenés dudas sobre tu cobertura de obra social, necesitás solicitar un turno o querés asesoramiento sobre tu tratamiento? 
            Estamos aquí para acompañarte en cada paso.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* ───────── COLUMNA IZQUIERDA: INFO DE CONTACTO ───────── */}
          <div className="lg:col-span-4 space-y-10">
            <div className="space-y-6">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-sky-500/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icons.WhatsApp />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp</p>
                  <p className="text-xs text-zinc-400 group-hover:text-emerald-400 transition-colors">Respuesta inmediata</p>
                </div>
                <div className="ml-auto text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <Icons.ArrowRight />
                </div>
              </a>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-zinc-400 flex items-center justify-center flex-shrink-0">
                    <Icons.Mail />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Email</p>
                    <a href="mailto:contacto@kinesio.ar" className="text-sm text-zinc-400 hover:text-sky-300 transition-colors">
                      contacto@kinesio.ar
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-zinc-400 flex items-center justify-center flex-shrink-0">
                    <Icons.MapPin />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Consultorio</p>
                    <p className="text-sm text-zinc-400">Buenos Aires, Argentina 🇦🇷</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-zinc-400 flex items-center justify-center flex-shrink-0">
                    <Icons.Clock />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Horarios de Atención</p>
                    <p className="text-sm text-zinc-400">Lunes a Sábados: 8:00 a 20:00 hs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───────── COLUMNA DERECHA: FORMULARIO LIMPIO ───────── */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Fila 1: Nombre y Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Nombre completo *</label>
                  <input
                    type="text"
                    id="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Tu nombre y apellido"
                    className={getInputClass('name')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Email o Teléfono *</label>
                  <input
                    type="text"
                    id="contact"
                    value={form.contact}
                    onChange={handleChange}
                    placeholder="Para coordinar tu turno"
                    className={getInputClass('contact')}
                    required
                  />
                </div>
              </div>

              {/* Fila 2: Interés */}
              <div className="space-y-2">
                <label htmlFor="interest" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Motivo de consulta</label>
                <select
                  id="interest"
                  value={form.interest}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-100 focus:outline-none focus:border-sky-400 transition-colors duration-300 text-base appearance-none cursor-pointer"
                >
                  <option value="general" className="bg-zinc-900">Consulta general</option>
                  <option value="obra-social" className="bg-zinc-900">Consulta por cobertura de Obra Social / Prepaga</option>
                  <option value="turno" className="bg-zinc-900">Solicitar turno para evaluación kinésica</option>
                  <option value="domicilio" className="bg-zinc-900">Kinesiología y rehabilitación a domicilio</option>
                  <option value="convenios" className="bg-zinc-900">Convenios empresariales o clubes deportivos</option>
                </select>
              </div>

              {/* Fila 3: Mensaje */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-medium uppercase tracking-wider text-zinc-500">Tu mensaje *</label>
                <textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Contanos brevemente tu motivo de consulta, tu obra social o la zona que necesita atención..."
                  className={getInputClass('message')}
                  required
                />
              </div>

              {/* Botón de Envío Minimalista */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-medium text-sm tracking-wide transition-all duration-300 min-h-[52px] ${
                    loading 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                      : 'bg-white text-zinc-950 hover:bg-sky-50 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Consulta</span>
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        <Icons.ArrowRight />
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Mensajes de Estado */}
              {status.message && (
                <div className={`p-4 rounded-xl text-sm font-medium animate-fadeInUp ${
                  status.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {status.message}
                </div>
              )}

              <p className="text-xs text-zinc-600 pt-4">
                Al enviar, aceptás nuestra política de privacidad. Tus datos están protegidos bajo la Ley de Protección de Datos Personales (Ley 25.326).
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}