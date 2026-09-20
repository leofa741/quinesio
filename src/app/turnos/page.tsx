'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarPlus, faClock, faFileMedical, 
  faCheckCircle, faArrowRight, faUserMd, faShieldHalved 
} from '@fortawesome/free-solid-svg-icons';

export default function TurnosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [proximosTurnos, setProximosTurnos] = useState<any[]>([]);
  const [loadingTurnos, setLoadingTurnos] = useState(true);

  // Seguridad: Redirecciones
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/turnos');
    } else if (status === 'authenticated' && session?.user?.role !== 'pacientes' && session?.user?.role !== 'admin') {
      router.push('/gestion');
    }
  }, [status, session, router]);

  // Obtener el próximo turno del paciente al cargar
  useEffect(() => {
    const fetchMisTurnos = async () => {
      if (status === 'authenticated' && session?.user?.role === 'pacientes') {
        try {
          const res = await fetch('/api/turnos/mis-turnos');
          const data = await res.json();
          if (data.success) {
            // Filtrar solo turnos futuros y que no estén cancelados
            const ahora = new Date();
            const futuros = data.turnos.filter((t: any) => 
              new Date(t.fechaInicio) > ahora && t.estado !== 'cancelado'
            ).sort((a: any, b: any) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
            
            setProximosTurnos(futuros.slice(0, 2)); // Mostrar máx. los 2 próximos
          }
        } catch (error) {
          console.error('Error cargando turnos:', error);
        } finally {
          setLoadingTurnos(false);
        }
      }
    };
    fetchMisTurnos();
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ========================================== */}
      {/* HERO SECTION CON ACCESO RÁPIDO             */}
      {/* ========================================== */}
      <div className="relative overflow-hidden mt-40 bg-gradient-to-b from-sky-950/40 to-slate-950 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-sky-400 uppercase bg-sky-500/10 rounded-full border border-sky-500/20">
              Portal del Paciente
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
              Tu salud, organizada y bajo control
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Gestiona tus citas, consulta tu historial y mantente en contacto con tu equipo de kinesiología de forma rápida y segura.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/turnos/reservar')}
                className="group px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20"
              >
                <FontAwesomeIcon icon={faCalendarPlus} />
                Reservar Nuevo Turno
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => router.push('/profile')}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faFileMedical} />
                Mi Perfil y Documentos
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        
        {/* ========================================== */}
        {/* WIDGET: PRÓXIMOS TURNOS (Valor Inmediato)  */}
        {/* ========================================== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faClock} className="text-sky-500" />
              Tus Próximas Citas
            </h2>
            <button onClick={() => router.push('/turnos/mis-turnos')} className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
              Ver historial completo →
            </button>
          </div>

          {loadingTurnos ? (
            <div className="h-32 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse" />
          ) : proximosTurnos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {proximosTurnos.map((turno) => (
                <motion.div 
                  key={turno._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faUserMd} className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{turno.profesional.name} {turno.profesional.lastName}</p>
                        <p className="text-xs text-slate-400">{turno.profesional.especialidades?.[0] || 'Kinesiología'}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      turno.estado === 'confirmado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {turno.estado === 'confirmado' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="text-slate-500" />
                      {new Date(turno.fechaInicio).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="w-px h-4 bg-slate-700" />
                    <div>
                      {new Date(turno.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 text-center">
              <FontAwesomeIcon icon={faCalendarPlus} className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-slate-400 mb-4">No tienes turnos programados próximamente.</p>
              <button 
                onClick={() => router.push('/turnos/reservar')}
                className="text-sky-400 hover:text-sky-300 font-medium text-sm hover:underline"
              >
                Agendar una cita ahora
              </button>
            </div>
          )}
        </section>

        {/* ========================================== */}
        {/* CÓMO FUNCIONA (Reduce fricción)            */}
        {/* ========================================== */}
        <section>
          <h2 className="text-2xl font-bold text-center mb-10">Reservar es muy simple</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: faUserMd, 
                title: '1. Elige a tu profesional', 
                desc: 'Revisa perfiles, especialidades y horarios disponibles de nuestro equipo.' 
              },
              { 
                icon: faClock, 
                title: '2. Selecciona día y hora', 
                desc: 'El calendario te mostrará en tiempo real los huecos libres para agendar.' 
              },
              { 
                icon: faCheckCircle, 
                title: '3. Recibe confirmación', 
                desc: 'Te enviaremos un correo electrónico con los detalles y recordatorios.' 
              }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-sky-500/30 transition-all"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <FontAwesomeIcon icon={step.icon} className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================================== */}
        {/* BENEFICIOS (Genera confianza)              */}
        {/* ========================================== */}
        <section className="bg-slate-900/50 rounded-3xl p-8 md:p-12 border border-slate-800">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">¿Por qué gestionar tus turnos online?</h2>
              <ul className="space-y-4">
                {[
                  'Acceso 24/7 para agendar o reprogramar desde cualquier dispositivo.',
                  'Historial clínico digital de tus sesiones y evoluciones.',
                  'Recordatorios automáticos para que nunca olvides una cita.',
                  'Gestión simplificada de autorizaciones de obras sociales.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-sky-500 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full" />
              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Turno Confirmado</p>
                    <p className="text-xs text-slate-400">Hoy, 10:00 hs</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full mb-2 w-3/4" />
                <div className="h-2 bg-slate-800 rounded-full w-1/2" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}