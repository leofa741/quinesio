'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faClock, faUserMd, faTimes, faCheckCircle, faHourglassHalf, 
  faImage, faSpinner, faUpload 
} from '@fortawesome/free-solid-svg-icons';

interface Turno {
  _id: string;
  profesional: {
    name: string;
    lastName: string;
    especialidades?: string[];
  };
  fechaInicio: string;
  fechaFin: string;
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'completado';
  motivoConsulta?: string;
  comprobantePagoUrl?: string; // ✅ Agregado para saber si ya subió uno
}

export default function MisTurnosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ ESTADOS PARA EL MODAL DE COMPROBANTE
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTurnoId, setSelectedTurnoId] = useState<string | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/turnos/mis-turnos');
      return;
    }
    if (status === 'authenticated') {
      fetchMisTurnos();
    }
  }, [status, router]);

  const fetchMisTurnos = async () => {
    try {
      const res = await fetch('/api/turnos/mis-turnos');
      const data = await res.json();
      if (data.success) {
        setTurnos(data.turnos);
      }
    } catch (error) {
      toast.error('Error al cargar tus turnos');
    } finally {
      setLoading(false);
    }
  };

  const cancelarTurno = async (turnoId: string) => {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;

    try {
      const res = await fetch(`/api/turnos?id=${turnoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estado: 'cancelado',
          motivoCancelacion: 'Cancelado por el paciente'
        }),
      });

      if (res.ok) {
        toast.success('Turno cancelado correctamente');
        fetchMisTurnos();
      } else {
        toast.error('Error al cancelar el turno');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // ✅ FUNCIÓN PARA SUBIR EL COMPROBANTE
  const handleUploadComprobante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comprobanteFile || !selectedTurnoId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('comprobantePago', comprobanteFile);

    try {
      const res = await fetch(`/api/turnos?id=${selectedTurnoId}`, {
        method: 'PATCH',
        body: formData, // Se envía como FormData, la API ya está preparada para esto
      });

      if (res.ok) {
        toast.success('✅ Comprobante enviado. La administración lo verificará pronto.');
        setShowUploadModal(false);
        setComprobanteFile(null);
        fetchMisTurnos(); // Recargamos para actualizar la UI
      } else {
        const data = await res.json();
        toast.error(data.message || 'Error al subir el comprobante');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión al subir el comprobante');
    } finally {
      setIsUploading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      pendiente: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: faHourglassHalf, text: 'Pendiente' },
      confirmado: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: faCheckCircle, text: 'Confirmado' },
      cancelado: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: faTimes, text: 'Cancelado' },
      completado: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: faCheckCircle, text: 'Completado' },
    };
    return estados[estado as keyof typeof estados] || estados.pendiente;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mt-40 mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-sky-500" />
          Mis Turnos
        </h1>

        {turnos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">No tienes turnos agendados</p>
            <p className="text-sm text-slate-500">
              La administración se pondrá en contacto contigo para coordinar tu primera sesión.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {turnos.map((turno) => {
              const estado = getEstadoBadge(turno.estado);
              const fecha = new Date(turno.fechaInicio);
              
              return (
                <div key={turno._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-sky-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <FontAwesomeIcon icon={faUserMd} className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-white">
                          {turno.profesional.name} {turno.profesional.lastName}
                        </h3>
                        <p className="text-sky-400 text-sm mb-2">
                          {turno.profesional.especialidades?.join(', ') || 'Kinesiología'}
                        </p>
                        {turno.motivoConsulta && (
                          <p className="text-slate-400 text-sm">{turno.motivoConsulta}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estado.color}`}>
                      <FontAwesomeIcon icon={estado.icon} className="w-3 h-3" />
                      {estado.text}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
                      {fecha.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                      {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </div>
                  </div>

                  {/* ✅ ACCIONES DEL PACIENTE: Solo si está pendiente */}
                  {turno.estado === 'pendiente' && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setSelectedTurnoId(turno._id);
                          setComprobanteFile(null);
                          setShowUploadModal(true);
                        }}
                        className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faUpload} /> Subir Comprobante de Pago
                      </button>
                      <button
                        onClick={() => cancelarTurno(turno._id)}
                        className="flex-1 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faTimes} /> Cancelar Turno
                      </button>
                    </div>
                  )}
                  
                  {/* Indicador visual si ya subió un comprobante */}
                  {turno.comprobantePagoUrl && turno.estado === 'pendiente' && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Comprobante enviado. Esperando validación de la administración.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL PARA SUBIR COMPROBANTE               */}
      {/* ========================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faImage} className="text-sky-500" /> Subir Comprobante
              </h3>
              <button 
                onClick={() => { setShowUploadModal(false); setComprobanteFile(null); }} 
                className="text-slate-400 hover:text-white transition"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">
              Adjunta la captura de pantalla de tu transferencia para que la administración valide este turno.
            </p>
            
            <form onSubmit={handleUploadComprobante} className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-sky-500/30 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FontAwesomeIcon icon={faImage} className="w-8 h-8 text-sky-500 mb-2" />
                  <p className="text-xs text-slate-400 text-center px-2">
                    {comprobanteFile ? comprobanteFile.name : 'Click para seleccionar la imagen'}
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)} 
                  required 
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowUploadModal(false); setComprobanteFile(null); }} 
                  className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading || !comprobanteFile} 
                  className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {isUploading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheckCircle} />}
                  {isUploading ? 'Enviando...' : 'Enviar Comprobante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}