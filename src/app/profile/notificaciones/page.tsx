'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { 
  FaBell, FaTrash, FaToggleOn, FaToggleOff, 
  FaArrowLeft, FaSpinner, FaCalendarCheck, 
} from 'react-icons/fa6';
import { FaSearch, FaUserMd } from 'react-icons/fa';

// 🎨 Sistema de diseño consistente (adaptado a tonos médicos/kine)
const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  border: 'border-slate-700/50',
  borderHover: 'border-sky-500/40',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
  textAccent: 'text-sky-400',
  gradient: 'from-sky-600 via-blue-600 to-indigo-600',
  shadow: 'shadow-2xl shadow-sky-900/20',
};

interface PreferenciaNotificacion {
  _id: string;
  tipo: 'turno_libre' | 'nuevo_servicio' | 'recordatorio';
  profesional?: {
    nombre: string;
    especialidad: string;
  };
  tratamiento?: string;
  diasPreferidos?: string[];
  activo: boolean;
  canal: 'email' | 'whatsapp' | 'ambos';
  createdAt: string;
}

interface RespuestaAPI {
  success: boolean;
  preferencias?: PreferenciaNotificacion[];
  error?: string;
}

function NotificacionesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'activas' | 'inactivas'>('todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPreferencias();
    } else if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/profile/notificaciones`);
    }
  }, [status, router]);

  const fetchPreferencias = async () => {
    try {
      const res = await fetch('/api/notificaciones');
      const data: RespuestaAPI = await res.json();   
      if (data.success && data.preferencias) {
        setPreferencias(data.preferencias);
      } else {
        toast.error(data.error || 'Error cargando preferencias');
      }
    } catch (error) {
      console.error('❌ Error fetching:', error);
      toast.error('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (id: string, currentActivo: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/notificaciones?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !currentActivo })
      });     
      
      if (res.ok) {
        setPreferencias(prev => prev.map(p => p._id === id ? { ...p, activo: !currentActivo } : p));
        toast.success(`Notificación ${!currentActivo ? 'activada' : 'pausada'}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error actualizando');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarPreferencia = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta preferencia?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/notificaciones?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPreferencias(prev => prev.filter(p => p._id !== id));
        toast.success('Preferencia eliminada');
      } else {
        toast.error('Error eliminando');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const preferenciasFiltradas = preferencias.filter(p => {
    if (filtro === 'activas' && !p.activo) return false;
    if (filtro === 'inactivas' && p.activo) return false;
    
    if (busqueda.trim()) {
      const query = busqueda.toLowerCase();
      const matchProf = p.profesional?.nombre.toLowerCase().includes(query);
      const matchTrat = p.tratamiento?.toLowerCase().includes(query);
      if (!matchProf && !matchTrat) return false;
    }
    return true;
  });

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-4" />
          <p className={theme.textSecondary}>Cargando tus preferencias...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-20`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      </div>
      <br/>   <br/>   <br/>

      <div className="pt-24 lg:pt-28 relative z-10 px-4 md:px-8 pb-12">
        
        {/* ========================================== */}
        {/* HEADER COMPLETO CON EL BOTÓN DE PRUEBA     */}
        {/* ========================================== */}
        <header className="mb-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/profile" className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.textSecondary} hover:${theme.textAccent} transition-all`}>
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm">Volver al Perfil</span>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-white via-sky-200 to-white bg-clip-text text-transparent">
                  Mis Alertas y Preferencias
                </span>
              </h1>
              <p className={theme.textSecondary}>
                Gestioná cuándo y cómo querés recibir avisos sobre turnos y tratamientos.
              </p>
            </div>
            
            {/* 🎯 BOTÓN DE PRUEBA INTEGRADO */}
            {preferencias.length === 0 && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/notificaciones', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        tipo: 'turno_libre',
                        profesional: { nombre: 'Lic. Juan Pérez', especialidad: 'Kinesiología Deportiva' },
                        diasPreferidos: ['Martes', 'Jueves'],
                        canal: 'whatsapp'
                      })
                    });
                    if (res.ok) {
                      toast.success('✅ Alerta de prueba creada');
                      fetchPreferencias(); // Recargar la lista
                    }
                  } catch (e) {
                    toast.error('Error al crear prueba');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-sky-900/30"
              >
                <FaCalendarCheck className="w-4 h-4" />
                Crear Alerta de Prueba
              </button>
            )}
          </div>
        </header>
        {/* ========================================== */}

        {/* Barra de búsqueda y filtros */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por profesional o tratamiento..."
                className={`w-full pl-10 pr-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl 
                          ${theme.textPrimary} placeholder-slate-500 focus:outline-none 
                          focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all`}
              />
            </div>
            <div className="flex gap-2">
              {(['todas', 'activas', 'inactivas'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    filtro === f
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                      : `${theme.bgCard} ${theme.border} ${theme.textSecondary} hover:${theme.textPrimary} hover:border-sky-500/40`
                  }`}
                >
                  {f === 'todas' ? 'Todas' : f === 'activas' ? 'Activas' : 'Pausadas'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto">
          {preferenciasFiltradas.length === 0 && (
            <div className={`${theme.bgCard} ${theme.border} rounded-2xl p-8 text-center ${theme.shadow}`}>
              <FaBell className={`w-12 h-12 ${theme.textSecondary} mx-auto mb-4 opacity-50`} />
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
                {preferencias.length === 0 ? 'Aún no tenés alertas configuradas' : 'No se encontraron resultados'}
              </h3>
              <p className={`${theme.textSecondary} mb-6`}>
                {preferencias.length === 0 
                  ? 'Hacé clic en "Crear Alerta de Prueba" o solicitá en recepción que te agreguen a la lista de espera.'
                  : 'Probá ajustar los filtros o la búsqueda.'}
              </p>
            </div>
          )}

          {preferenciasFiltradas.length > 0 && (
            <div className="space-y-4">
              {preferenciasFiltradas.map((pref) => (
                <PreferenciaCard
                  key={pref._id}
                  pref={pref}
                  onToggle={() => toggleActivo(pref._id, pref.activo)}
                  onDelete={() => eliminarPreferencia(pref._id)}
                  loading={actionLoading === pref._id}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PreferenciaCard({ pref, onToggle, onDelete, loading }: { 
  pref: PreferenciaNotificacion; 
  onToggle: () => void; 
  onDelete: () => void;
  loading: boolean;
}) {
  const getDescripcion = () => {
    if (pref.tipo === 'turno_libre') {
      return { 
        titulo: `Turno libre: ${pref.profesional?.nombre || 'Profesional'}`, 
        subtitle: `${pref.profesional?.especialidad || 'Kinesiología'} · Días: ${pref.diasPreferidos?.join(', ') || 'Cualquiera'}` 
      };
    }
    if (pref.tipo === 'nuevo_servicio') {
      return { 
        titulo: `Nuevo cupo: ${pref.tratamiento || 'Tratamiento'}`, 
        subtitle: 'Avísame cuando se habiliten nuevos horarios o grupos.' 
      };
    }
    return { titulo: 'Preferencia de Notificación', subtitle: `Canal: ${pref.canal}` };
  };

  const { titulo, subtitle } = getDescripcion();

  return (
    <div className={`${theme.bgCard} ${theme.border} rounded-2xl p-5 ${theme.shadow} 
                    hover:${theme.borderHover} hover:bg-slate-800/90 transition-all duration-300`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={`flex-shrink-0 w-16 h-16 rounded-xl ${theme.bgCard} border ${theme.border} 
                      flex items-center justify-center`}>
          {pref.tipo === 'turno_libre' ? <FaCalendarCheck className={`w-7 h-7 ${theme.textAccent}`} /> : <FaUserMd className={`w-7 h-7 ${theme.textAccent}`} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} truncate`}>{titulo}</h3>
              <p className={`text-sm ${theme.textSecondary} mt-1`}>{subtitle}</p>
              
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  pref.activo 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}>
                  {pref.activo ? '🟢 Activa' : '⏸️ Pausada'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30 capitalize">
                  📱 {pref.canal}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={onToggle} disabled={loading}
                className={`p-2 rounded-lg transition-all ${pref.activo ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:bg-slate-700/50'} disabled:opacity-60`}
                title={pref.activo ? 'Pausar' : 'Activar'}>
                {loading ? <FaSpinner className="w-5 h-5 animate-spin" /> : pref.activo ? <FaToggleOn className="w-6 h-6" /> : <FaToggleOff className="w-6 h-6" />}
              </button>
              <button onClick={onDelete} disabled={loading}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all disabled:opacity-60"
                title="Eliminar">
                {loading ? <FaSpinner className="w-5 h-5 animate-spin" /> : <FaTrash className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificacionesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <FaSpinner className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-4" />
        <p className="text-slate-400">Cargando...</p>
      </div>
    }>
      <NotificacionesContent />
    </Suspense>
  );
}