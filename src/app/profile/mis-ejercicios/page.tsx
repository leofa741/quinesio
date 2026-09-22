'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDumbbell, faArrowLeft, faSpinner, faUserMd, 
  faCalendarAlt, faNotesMedical, faPlay, faCheckCircle,
  faTimesCircle, faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';

interface EjercicioDetalle {
  ejercicioId: {
    _id: string;
    nombre: string;
    categoria: string;
    videoUrl?: string;
    descripcion?: string;
  };
  series: string;
  repeticiones: string;
  frecuencia: string;
  notasEspecificas?: string;
}

interface Plan {
  _id: string;
  profesional: {
    _id: string;
    name: string;
    lastName: string;
    especialidades?: string[];
  };
  fechaInicio: string;
  fechaFin?: string;
  notasGenerales?: string;
  ejercicios: EjercicioDetalle[];
  createdAt: string;
}

export default function MisEjerciciosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/mis-ejercicios');
      return;
    }
    if (status === 'authenticated') fetchPlanes();
  }, [status, router]);

  const fetchPlanes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mis-ejercicios');
      const data = await res.json();
      if (data.success) {
        setPlanes(data.planes || []);
      } else {
        toast.error('Error al cargar tus ejercicios');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-sky-500 mb-4" />
          <p className="text-slate-400">Cargando tus rutinas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mt-32 mx-auto">
        
        {/* Botón Volver */}
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-6 group"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="group-hover:-translate-x-1 transition-transform" />
          Volver a mi perfil
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2">
            <FontAwesomeIcon icon={faDumbbell} className="text-sky-500" />
            Mis Rutinas de Ejercicios
          </h1>
          <p className="text-slate-400 text-sm">
            Aquí verás los planes de ejercicios que te han asignado tus profesionales.
          </p>
        </div>

        {/* Lista de Planes */}
        {planes.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
            <FontAwesomeIcon icon={faDumbbell} className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aún no tienes rutinas asignadas</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Cuando tu profesional te asigne un plan de ejercicios, aparecerá aquí automáticamente.
            </p>
            <Link 
              href="/profile" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition"
            >
              Volver al perfil
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {planes.map((plan) => (
              <div 
                key={plan._id} 
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-sky-500/30 transition-all"
              >
                {/* Cabecera del Plan (Siempre visible) */}
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => togglePlan(plan._id)}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faDumbbell} className="text-sky-400 text-xl" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white text-lg">
                          Plan de {plan.ejercicios.length} ejercicio{plan.ejercicios.length !== 1 ? 's' : ''}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 flex-wrap">
                          <FontAwesomeIcon icon={faUserMd} className="w-3 h-3" />
                          <span>
                            {plan.profesional.name} {plan.profesional.lastName}
                            {plan.profesional.especialidades?.[0] && (
                              <span className="text-slate-500"> · {plan.profesional.especialidades[0]}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                        Activo
                      </span>
                      <FontAwesomeIcon 
                        icon={expandedPlan === plan._id ? faTimesCircle : faPlay} 
                        className={`w-5 h-5 transition-transform ${expandedPlan === plan._id ? 'text-sky-400' : 'text-slate-500'}`}
                      />
                    </div>
                  </div>

                  {/* Info rápida */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-800/50 rounded-lg p-2.5">
                      <p className="text-slate-500 mb-0.5 flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" /> Inicio
                      </p>
                      <p className="text-white font-medium">
                        {new Date(plan.fechaInicio).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    {plan.fechaFin && (
                      <div className="bg-slate-800/50 rounded-lg p-2.5">
                        <p className="text-slate-500 mb-0.5 flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" /> Vigencia
                        </p>
                        <p className="text-white font-medium">
                          {new Date(plan.fechaFin).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    )}
                    <div className="bg-slate-800/50 rounded-lg p-2.5">
                      <p className="text-slate-500 mb-0.5">Asignado</p>
                      <p className="text-white font-medium">
                        {new Date(plan.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenido Expandido (Solo al hacer clic) */}
                {expandedPlan === plan._id && (
                  <div className="border-t border-slate-800 p-5 bg-slate-900/50 space-y-4">
                    
                    {/* Notas Generales */}
                    {plan.notasGenerales && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FontAwesomeIcon icon={faNotesMedical} /> Indicaciones del Profesional
                        </p>
                        <p className="text-amber-100 text-sm">{plan.notasGenerales}</p>
                      </div>
                    )}

                    {/* Lista de Ejercicios */}
                    <div>
                      <h4 className="text-sm font-semibold text-sky-400 mb-3 uppercase tracking-wider">
                        Tu Rutina de Ejercicios
                      </h4>
                      <div className="space-y-3">
                        {plan.ejercicios.map((ej, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-sky-500/30 transition"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0 text-sky-400 font-bold text-sm">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-white">
                                    {ej.ejercicioId.nombre}
                                  </h5>
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                                    {ej.ejercicioId.categoria}
                                  </span>
                                </div>
                              </div>
                              {ej.ejercicioId.videoUrl && (
                                <a 
                                  href={ej.ejercicioId.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition flex-shrink-0"
                                >
                                  <FontAwesomeIcon icon={faPlay} /> Ver Video
                                </a>
                              )}
                            </div>

                            {/* Detalles del ejercicio */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Series</p>
                                <p className="text-white font-bold text-lg">{ej.series}</p>
                              </div>
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Reps</p>
                                <p className="text-white font-bold text-lg">{ej.repeticiones}</p>
                              </div>
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Frecuencia</p>
                                <p className="text-white font-bold text-sm">{ej.frecuencia}</p>
                              </div>
                            </div>

                            {ej.notasEspecificas && (
                              <div className="bg-slate-900/50 border-l-2 border-sky-500 rounded-r-lg p-2.5">
                                <p className="text-xs text-slate-300 italic">
                                  💡 {ej.notasEspecificas}
                                </p>
                              </div>
                            )}

                            {ej.ejercicioId.descripcion && (
                              <p className="text-xs text-slate-400 mt-2">
                                {ej.ejercicioId.descripcion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}