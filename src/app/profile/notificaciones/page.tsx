'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { 
  FaBell, FaTrash, FaToggleOn, FaToggleOff, 
  FaArrowLeft, FaSpinner, FaCalendarCheck, FaPlus,
   FaCheck
} from 'react-icons/fa6';
import { FaSearch, FaUserMd, FaBellSlash, FaWhatsapp, FaEnvelope, FaTimes } from 'react-icons/fa';

// 🎨 Sistema de diseño consistente
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
  profesional?: { nombre: string; especialidad: string };
  tratamiento?: string;
  diasPreferidos?: string[];
  activo: boolean;
  canal: 'email' | 'whatsapp' | 'ambos';
  createdAt: string;
}

interface Profesional {
  _id: string;
  name: string;
  lastName: string;
  especialidades: string[];
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function NotificacionesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacion[]>([]);
  const [profesionalesList, setProfesionalesList] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'activas' | 'inactivas'>('todas');
  const [busqueda, setBusqueda] = useState('');

  // Estado para el modal de creación REAL
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    profesionalId: '',
    diasPreferidos: [] as string[],
    canal: 'email' as 'email' | 'whatsapp' | 'ambos'
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPreferencias();
      fetchProfesionales();
    } else if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/profile/notificaciones`);
    }
  }, [status, router]);

  const fetchPreferencias = async () => {
    try {
      const res = await fetch('/api/notificaciones');
      const data = await res.json();   
      if (data.success && data.preferencias) {
        setPreferencias(data.preferencias);
      }
    } catch (error) {
      toast.error('Error de conexión al cargar alertas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesionales = async () => {
    try {
      const res = await fetch('/api/admin/profesionales');
      const data = await res.json();
      if (data.success) setProfesionalesList(data.profesionales);
    } catch (error) {
      console.error('Error cargando profesionales:', error);
    }
  };

  const toggleDia = (dia: string) => {
    setNewAlert(prev => ({
      ...prev,
      diasPreferidos: prev.diasPreferidos.includes(dia)
        ? prev.diasPreferidos.filter(d => d !== dia)
        : [...prev.diasPreferidos, dia]
    }));
  };

  const handleCreateRealAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.profesionalId || newAlert.diasPreferidos.length === 0) {
      toast.warning('Debes seleccionar un profesional y al menos un día.');
      return;
    }

    setActionLoading('creating');
    const profSeleccionado = profesionalesList.find(p => p._id === newAlert.profesionalId);

    try {
      const res = await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'turno_libre',
          profesional: { 
            nombre: `${profSeleccionado?.name} ${profSeleccionado?.lastName}`, 
            especialidad: profSeleccionado?.especialidades?.[0] || 'Kinesiología' 
          },
          diasPreferidos: newAlert.diasPreferidos,
          canal: newAlert.canal,
          activo: true
        })
      });

      if (res.ok) {
        toast.success('✅ Alerta real creada exitosamente');
        setIsCreateModalOpen(false);
        setNewAlert({ profesionalId: '', diasPreferidos: [], canal: 'email' });
        fetchPreferencias();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al crear la alerta');
      }
    } catch (error) {
      toast.error('Error de conexión al crear la alerta');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActivo = async (id: string, currentActivo: boolean) => {
    setActionLoading(id);
    const nuevoEstado = !currentActivo;
    try {
      const res = await fetch(`/api/notificaciones?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado })
      });     
      if (res.ok) {
        setPreferencias(prev => prev.map(p => p._id === id ? { ...p, activo: nuevoEstado } : p));
        toast.success(nuevoEstado ? '🔔 Alerta activada' : '⏸️ Alerta pausada', { position: 'top-right' });
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarPreferencia = async (id: string, titulo: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar esta alerta?',
      html: `<p class="text-slate-400 text-sm mb-2">Estás por eliminar:</p><p class="text-white font-semibold">"${titulo}"</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f1f5f9',
      customClass: { popup: 'border border-slate-700 rounded-2xl' }
    });

    if (!result.isConfirmed) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/notificaciones?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPreferencias(prev => prev.filter(p => p._id !== id));
        toast.success('🗑️ Alerta eliminada', { position: 'top-right' });
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
        <FaSpinner className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-4" />
        <p className={theme.textSecondary}>Cargando tus preferencias...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-20`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      </div>

      <div className="pt-24 lg:pt-28 relative z-10 px-4 md:px-8 pb-12">
        <header className="mb-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/profile" className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.textSecondary} hover:text-sky-400 transition-all`}>
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm">Volver al Perfil</span>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-white via-sky-200 to-white bg-clip-text text-transparent">
                  Mis Alertas de Turnos
                </span>
              </h1>
              <p className={theme.textSecondary}>
                Te avisaremos automáticamente cuando se libere un turno con tus profesionales favoritos.
              </p>
            </div>
            
            {/* ✅ BOTÓN REAL PARA CREAR ALERTA */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-sky-900/30 hover:shadow-sky-500/40 hover:-translate-y-0.5"
            >
              <FaPlus className="w-4 h-4" />
              Crear Nueva Alerta
            </button>
          </div>
        </header>

        {/* Barra de búsqueda y filtros */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por profesional..."
                className={`w-full pl-10 pr-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl ${theme.textPrimary} placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all`}
              />
            </div>
            <div className="flex gap-2">
              {(['todas', 'activas', 'inactivas'] as const).map((f) => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    filtro === f ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30' : `${theme.bgCard} ${theme.border} ${theme.textSecondary} hover:text-white hover:border-sky-500/40`
                  }`}>
                  {f === 'todas' ? 'Todas' : f === 'activas' ? 'Activas' : 'Pausadas'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto">
          {preferenciasFiltradas.length === 0 && (
            <div className={`${theme.bgCard} ${theme.border} rounded-2xl p-12 text-center ${theme.shadow}`}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <FaBellSlash className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-2`}>
                {preferencias.length === 0 ? 'Aún no tenés alertas configuradas' : 'No se encontraron resultados'}
              </h3>
              <p className={`${theme.textSecondary} mb-6 max-w-md mx-auto`}>
                {preferencias.length === 0 
                  ? 'Configura tu primera alerta para que te avisemos cuando tu profesional tenga un hueco libre.'
                  : 'Probá ajustar los filtros o la búsqueda.'}
              </p>
              {preferencias.length === 0 && (
                <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition-all">
                  <FaPlus className="w-4 h-4" /> Crear mi primera alerta
                </button>
              )}
            </div>
          )}

          {preferenciasFiltradas.length > 0 && (
            <div className="space-y-4">
              {preferenciasFiltradas.map((pref, idx) => (
                <div key={pref._id} style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.05}s both` }}>
                  <PreferenciaCard
                    pref={pref}
                    onToggle={() => toggleActivo(pref._id, pref.activo)}
                    onDelete={() => eliminarPreferencia(pref._id, pref.profesional?.nombre || 'Alerta')}
                    loading={actionLoading === pref._id}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ========================================== */}
      {/* MODAL DE CREACIÓN DE ALERTA REAL           */}
      {/* ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaBell className="text-sky-500" /> Nueva Alerta de Turno
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRealAlert} className="space-y-6">
              {/* 1. Selección de Profesional */}
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">1. Elegí tu profesional</label>
                <select 
                  value={newAlert.profesionalId}
                  onChange={(e) => setNewAlert({ ...newAlert, profesionalId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  required
                >
                  <option value="">Seleccionar profesional...</option>
                  {profesionalesList.map(prof => (
                    <option key={prof._id} value={prof._id}>
                      {prof.name} {prof.lastName} ({prof.especialidades?.[0] || 'Kinesiología'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Días preferidos */}
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">2. ¿Qué días te quedan bien?</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {DIAS_SEMANA.map(dia => {
                    const isSelected = newAlert.diasPreferidos.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => toggleDia(dia)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                          isSelected 
                            ? 'bg-sky-600 border-sky-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-sky-500/50 hover:text-white'
                        }`}
                      >
                        {isSelected && <FaCheck className="inline w-3 h-3 mr-1" />}
                        {dia.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Canal de notificación */}
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">3. ¿Cómo querés que te avisemos?</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'email', label: 'Email', icon: <FaEnvelope className="w-4 h-4" /> },
                    { id: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp className="w-4 h-4" /> },
                    { id: 'ambos', label: 'Ambos', icon: <FaBell className="w-4 h-4" /> }
                  ].map((canal) => (
                    <button
                      key={canal.id}
                      type="button"
                      onClick={() => setNewAlert({ ...newAlert, canal: canal.id as any })}
                      className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all ${
                        newAlert.canal === canal.id
                          ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {canal.icon}
                      <span className="text-xs font-medium">{canal.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading === 'creating'}
                  className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                >
                  {actionLoading === 'creating' ? <FaSpinner className="animate-spin" /> : <FaCheck className="w-4 h-4" />}
                  Guardar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function PreferenciaCard({ pref, onToggle, onDelete, loading }: { 
  pref: PreferenciaNotificacion; 
  onToggle: () => void; 
  onDelete: () => void;
  loading: boolean;
}) {
  const getCanalIcon = () => {
    if (pref.canal === 'whatsapp') return <FaWhatsapp className="w-3 h-3" />;
    if (pref.canal === 'email') return <FaEnvelope className="w-3 h-3" />;
    return <FaBell className="w-3 h-3" />;
  };

  return (
    <div className={`${theme.bgCard} ${theme.border} rounded-2xl p-5 ${theme.shadow} hover:border-sky-500/40 hover:bg-slate-800/90 transition-all duration-300`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={`flex-shrink-0 w-16 h-16 rounded-xl ${theme.bgCard} border ${theme.border} flex items-center justify-center`}>
          <FaCalendarCheck className={`w-7 h-7 ${theme.textAccent}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} truncate`}>
                Turno libre: {pref.profesional?.nombre || 'Profesional'}
              </h3>
              <p className={`text-sm ${theme.textSecondary} mt-1`}>
                {pref.profesional?.especialidad || 'Kinesiología'} · Días: {pref.diasPreferidos?.join(', ') || 'Cualquiera'}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  pref.activo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}>
                  {pref.activo ? '🟢 Activa' : '⏸️ Pausada'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30 capitalize">
                  {getCanalIcon()} {pref.canal}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={onToggle} disabled={loading}
                className={`p-2.5 rounded-lg transition-all ${pref.activo ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:bg-slate-700/50'} disabled:opacity-60`}
                title={pref.activo ? 'Pausar alerta' : 'Activar alerta'}>
                {loading ? <FaSpinner className="w-5 h-5 animate-spin" /> : pref.activo ? <FaToggleOn className="w-6 h-6" /> : <FaToggleOff className="w-6 h-6" />}
              </button>
              <button onClick={onDelete} disabled={loading}
                className="p-2.5 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all disabled:opacity-60"
                title="Eliminar alerta">
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