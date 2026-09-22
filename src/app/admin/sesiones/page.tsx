'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faNotesMedical, faPlus, faSpinner, faCheckCircle, faUserInjured, 
  faTimes, faHistory, faCalendarDay, faChartLine, faUserMd 
} from '@fortawesome/free-solid-svg-icons';
import { FaArrowLeft } from 'react-icons/fa';

interface Plan {
  _id: string;
  paciente: { _id: string; name: string; lastName: string };
  profesional: { _id: string; name: string; lastName: string };
  diagnostico: string;
  objetivo: string;
  totalSesiones: number;
  sesionesCompletadas: number;
  estado: string;
  fechaInicio: string;
}

interface NotaSesion {
  _id: string;
  numeroSesion: number;
  fecha: string;
  dolorEva: number;
  tecnicasAplicadas: string;
  evolucion: string;
  proximosPasos: string;
}

export default function SesionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el historial clínico
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [historial, setHistorial] = useState<NotaSesion[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/sesiones');
      return;
    }
    if (status === 'authenticated') fetchPlanes();
  }, [status, router]);

  // ✅ CORREGIDO: Llamamos sin parámetros. La API decidirá qué mostrar según tu rol.
  const fetchPlanes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/planes');
      const data = await res.json();
      if (data.success) {
        // La API ya filtra por estado 'activo', así que solo asignamos el array
        setPlanes(data.planes || []);
      } else {
        toast.error(data.message || 'Error al cargar los planes');
      }
    } catch (error) {
      toast.error('Error de conexión al cargar los planes');
    } finally {
      setLoading(false);
    }
  };

  const verHistorial = async (plan: Plan) => {
    setSelectedPlan(plan);
    setLoadingHistorial(true);
    try {
      const res = await fetch(`/api/sesiones?planId=${plan._id}`);
      const data = await res.json();
      if (data.success) {
        // Ordenar sesiones por número de sesión (de la más reciente a la más antigua)
        const sesionesOrdenadas = data.sesiones.sort((a: NotaSesion, b: NotaSesion) => b.numeroSesion - a.numeroSesion);
        setHistorial(sesionesOrdenadas);
      }
    } catch (error) {
      toast.error('Error al cargar el historial');
    } finally {
      setLoadingHistorial(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mt-40 mx-auto">
            <button 
                onClick={() => router.push('/gestion')} 
                className="inline-flex  mt-40 items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-8 group w-fit"
              >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
                Volver al Panel Principal
              </button>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faNotesMedical} className="text-sky-500" />
              Registro de Sesiones Clínicas
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gestiona la evolución y el progreso de tus pacientes.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {planes.length === 0 ? (
            <div className="col-span-full bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <FontAwesomeIcon icon={faUserInjured} className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No hay planes activos</h3>
              <p className="text-slate-400">Los planes se crean automáticamente al registrar la primera sesión de un paciente desde el calendario.</p>
            </div>
          ) : (
            planes.map((plan) => {
              const porcentaje = Math.round((plan.sesionesCompletadas / plan.totalSesiones) * 100);
              return (
                <div key={plan._id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.paciente.name} {plan.paciente.lastName}</h3>
                      <p className="text-sm text-sky-400">{plan.diagnostico}</p>
                      {/* ✅ NUEVO: Mostrar el profesional a cargo (muy útil para el Admin) */}
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <FontAwesomeIcon icon={faUserMd} className="w-3 h-3" /> 
                        {plan.profesional.name} {plan.profesional.lastName}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-sky-500/20 text-sky-400 text-xs font-medium rounded-full border border-sky-500/30">
                      Activo
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progreso</span>
                      <span>{plan.sesionesCompletadas} / {plan.totalSesiones} sesiones ({porcentaje}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-sky-500 h-2 rounded-full transition-all" style={{ width: `${porcentaje}%` }}></div>
                    </div>
                  </div>

                  <button
                    onClick={() => verHistorial(plan)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <FontAwesomeIcon icon={faHistory} /> Ver Historial Clínico
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL DE HISTORIAL CLÍNICO                 */}
      {/* ========================================== */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faChartLine} className="text-sky-500" /> 
                  Historial de Tratamiento
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedPlan.paciente.name} {selectedPlan.paciente.lastName} • {selectedPlan.diagnostico}
                </p>
              </div>
              <button onClick={() => { setSelectedPlan(null); setHistorial([]); }} className="text-slate-400 hover:text-white transition">
                <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
              </button>
            </div>

            {loadingHistorial ? (
              <div className="flex items-center justify-center py-12">
                <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-sky-500" />
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FontAwesomeIcon icon={faNotesMedical} className="w-12 h-12 mb-3 opacity-50" />
                <p>Aún no se han registrado sesiones para este plan.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumen del Plan */}
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-sky-400 uppercase tracking-wider mb-1">Objetivo</p>
                    <p className="text-white font-medium">{selectedPlan.objetivo || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-sky-400 uppercase tracking-wider mb-1">Inicio del Tratamiento</p>
                    <p className="text-white font-medium">{new Date(selectedPlan.fechaInicio).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-sky-400 uppercase tracking-wider mb-1">Progreso Total</p>
                    <p className="text-white font-medium">
                      {selectedPlan.sesionesCompletadas} de {selectedPlan.totalSesiones} sesiones completadas
                    </p>
                  </div>
                </div>

                {/* Línea de Tiempo de Sesiones */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarDay} className="text-sky-500" />
                    Registro de Sesiones
                  </h3>
                  
                  {historial.map((nota) => (
                    <div key={nota._id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 relative">
                      {/* Indicador de número de sesión */}
                      <div className="absolute -left-3 top-6 w-6 h-6 bg-sky-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-4 border-slate-900">
                        {nota.numeroSesion}
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 pl-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">
                            {new Date(nota.fecha).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                            Sesión {nota.numeroSesion}
                          </span>
                        </div>
                        {nota.dolorEva !== null && nota.dolorEva !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Dolor EVA:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              nota.dolorEva <= 3 ? 'bg-emerald-500/20 text-emerald-400' :
                              nota.dolorEva <= 6 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {nota.dolorEva}/10
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pl-4 space-y-3">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Técnicas Aplicadas</p>
                          <p className="text-slate-200 text-sm">{nota.tecnicasAplicadas}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Evolución y Notas Clínicas</p>
                          <p className="text-slate-200 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 whitespace-pre-wrap">
                            {nota.evolucion}
                          </p>
                        </div>
                        {nota.proximosPasos && (
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Próximos Pasos / Tareas</p>
                            <p className="text-sky-300 text-sm flex items-start gap-2">
                              <FontAwesomeIcon icon={faCheckCircle} className="mt-1 flex-shrink-0 text-xs" />
                              {nota.proximosPasos}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}