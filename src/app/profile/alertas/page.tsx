'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { 
  FaBell, FaBellSlash, FaTrash, FaToggleOn, FaToggleOff, 
  FaArrowLeft, FaSpinner,
} from 'react-icons/fa6';
import { FaCheckCircle, FaExclamationTriangle, FaSearch } from 'react-icons/fa';

// 🎨 Sistema de diseño consistente con tu app
const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  bgCardHover: 'bg-slate-800/90',
  border: 'border-slate-700/50',
  borderHover: 'border-violet-500/40',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
  textAccent: 'text-violet-400',
  gradient: 'from-violet-600 via-purple-600 to-indigo-600',
  shadow: 'shadow-2xl shadow-purple-900/20',
};

interface Alerta {
  _id: string;
  tipo: 'propiedad' | 'busqueda';
  propiedad?: {
    _id: string;
    titulo: string;
    imagen?: string;
    precio?: { monto?: number; moneda: string };
    direccion?: { barrio: string; ciudad: string };

    slug?: string;

  
    seo?: {
      slug?: string;
    };
  };
  criterios?: {
    tipoOperacion?: string;
    tipoPropiedad?: string[];
    ubicacion?: { barrio?: string[]; ciudad?: string; precioMin?: number; precioMax?: number };
  };
  activo: boolean;
  frecuencia: 'inmediato' | 'diario' | 'semanal';
  totalEnvios: number;
  ultimoEnvio?: string;
  createdAt: string;
}

interface AlertaResponse {
  success: boolean;
  alertas?: Alerta[];
  error?: string;
}

// 🔹 Componente para el contenido de la página (con Suspense)
function AlertasContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'activas' | 'inactivas'>('todas');
  const [busqueda, setBusqueda] = useState('');




  // 🔹 Efecto: cargar alertas al montar
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAlertas();
    } else if (status === 'unauthenticated') {
      router.push(`/login?returnTo=/profile/alertas`);
    }
  }, [status, router]);



  // 🔹 Efecto: manejar ?cancelar=todos
  useEffect(() => {
    const cancelarTodos = searchParams.get('cancelar');
    if (cancelarTodos === 'todos' && alertas.length > 0) {
      handleCancelarTodas();
    }
  }, [searchParams, alertas]);

  // 🔹 Fetch de alertas
  const fetchAlertas = async () => {
    try {
      const res = await fetch('/api/alertas?activas=false', {
        headers: { 'Content-Type': 'application/json' }
      });    
      const data: AlertaResponse = await res.json();   
      if (data.success && data.alertas) {
        setAlertas(data.alertas);
      } else {
        toast.error(data.error || 'Error cargando alertas');
      }
    } catch (error) {
      console.error('❌ Error fetching alertas:', error);
      toast.error('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };



 

  // 🔹 Toggle activar/desactivar alerta
  const toggleActivo = async (alertaId: string, currentActivo: boolean) => {
    setActionLoading(alertaId);
    try {
      const res = await fetch(`/api/alertas?id=${alertaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !currentActivo })
      });     
      
      if (res.ok) {
        setAlertas(prev => prev.map(a => 
          a._id === alertaId ? { ...a, activo: !currentActivo } : a
        ));
        toast.success(`Alerta ${!currentActivo ? 'activada' : 'desactivada'}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error actualizando alerta');
      }
    } catch (error) {
      console.error('❌ Error toggling alerta:', error);
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  // 🔹 Eliminar alerta individual
  const eliminarAlerta = async (alertaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta alerta?')) return;
    
    setActionLoading(alertaId);
    try {
      const res = await fetch(`/api/alertas?id=${alertaId}`, { method: 'DELETE' });
      
      if (res.ok) {
        setAlertas(prev => prev.filter(a => a._id !== alertaId));
        toast.success('Alerta eliminada');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error eliminando alerta');
      }
    } catch (error) {
      console.error('❌ Error deleting alerta:', error);
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  // 🔹 Cancelar TODAS las alertas (para ?cancelar=todos)
  const handleCancelarTodas = async () => {
    if (!confirm('¿Cancelar TODAS tus alertas? Esta acción no se puede deshacer.')) {
      // Remover el query param si el usuario cancela
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('cancelar');
      router.replace(`/profile/alertas?${newParams.toString()}`, { scroll: false });
      return;
    }
    
    setActionLoading('bulk');
    try {
      // Eliminar una por una (podés optimizar con un endpoint bulk si querés)
      const promises = alertas
        .filter(a => a.activo)
        .map(a => fetch(`/api/alertas?id=${a._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activo: false })
        }));
      
      await Promise.all(promises);
      
      // Actualizar estado local
      setAlertas(prev => prev.map(a => ({ ...a, activo: false })));
      toast.success('✅ Todas las alertas fueron desactivadas');
      
      // Limpiar query param
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('cancelar');
      router.replace(`/profile/alertas?${newParams.toString()}`, { scroll: false });
      
    } catch (error) {
      console.error('❌ Error cancelando todas:', error);
      toast.error('Error al cancelar algunas alertas');
    } finally {
      setActionLoading(null);
    }
  };

  // 🔹 Filtrar alertas
  const alertasFiltradas = alertas.filter(alerta => {
    // Filtro por estado
    if (filtro === 'activas' && !alerta.activo) return false;
    if (filtro === 'inactivas' && alerta.activo) return false;
    
    // Búsqueda por texto
    if (busqueda.trim()) {
      const query = busqueda.toLowerCase();
      const matchTitulo = alerta.propiedad?.titulo?.toLowerCase().includes(query);
      const matchBarrio = alerta.propiedad?.direccion?.barrio?.toLowerCase().includes(query);
      const matchCiudad = alerta.propiedad?.direccion?.ciudad?.toLowerCase().includes(query);
      const matchTipo = alerta.tipo.includes(query);
      
      if (!matchTitulo && !matchBarrio && !matchCiudad && !matchTipo) {
        return false;
      }
    }
    
    return true;
  });

  // 🔹 Loading inicial
  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className={theme.textSecondary}>Cargando tus alertas...</p>
        </div>
      </div>
    );
  }

  // 🔹 No autenticado (se redirige en el useEffect, pero por seguridad)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary}`}>
        <br/>
        <br/>

      
      {/* ✨ Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-20`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      </div>

      {/* 🚨 Espacio para navbar */}
      <div className="pt-24 lg:pt-28" />

      <div className="relative z-10 px-4 md:px-8 pb-12">
        
        {/* 🏷️ Header */}
        <header className="mb-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              href="/profile" 
              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.textSecondary} hover:${theme.textAccent} transition-all`}
            >
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm">Volver</span>
            </Link>
            <span className={theme.textSecondary}>/</span>
            <span className="text-sm text-slate-400">Perfil</span>
            <span className={theme.textSecondary}>/</span>
            <span className="text-sm text-white font-medium">Mis Alertas</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                  Mis Alertas Personalizadas
                </span>
              </h1>
              <p className={`${theme.textSecondary}`}>
                Gestioná las propiedades y búsquedas que querés seguir
              </p>
            </div>
            
            {/* Botón cancelar todas (solo si hay alertas activas) */}
            {alertas.some(a => a.activo) && (
              <button
                onClick={handleCancelarTodas}
                disabled={actionLoading === 'bulk'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 
                          border border-rose-500/40 text-rose-400 hover:text-rose-300 rounded-xl 
                          text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoading === 'bulk' ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaBellSlash className="w-4 h-4" />
                )}
                Cancelar todas
              </button>
            )}
          </div>
        </header>

        {/* 🔍 Barra de búsqueda y filtros */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por propiedad, barrio o ciudad..."
                className={`w-full pl-10 pr-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl 
                          ${theme.textPrimary} placeholder-slate-500 focus:outline-none 
                          focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all`}
              />
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              {(['todas', 'activas', 'inactivas'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    filtro === f
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                      : `${theme.bgCard} ${theme.border} ${theme.textSecondary} hover:${theme.textPrimary} hover:border-violet-500/40`
                  }`}
                >
                  {f === 'todas' ? 'Todas' : f === 'activas' ? 'Activas' : 'Inactivas'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 📋 Lista de alertas */}
        <main className="max-w-5xl mx-auto">
          
          {/* Estado vacío */}
          {alertasFiltradas.length === 0 && (
            <div className={`${theme.bgCard} ${theme.border} rounded-2xl p-8 text-center ${theme.shadow}`}>
              <FaBell className={`w-12 h-12 ${theme.textSecondary} mx-auto mb-4 opacity-50`} />
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
                {alertas.length === 0 ? 'Aún no tenés alertas' : 'No se encontraron alertas'}
              </h3>
              <p className={`${theme.textSecondary} mb-6`}>
                {alertas.length === 0 
                  ? 'Configurá alertas desde cualquier propiedad para recibir notificaciones.'
                  : 'Probá ajustar los filtros o la búsqueda.'
                }
              </p>
              {alertas.length === 0 && (
                <Link
                  href="/propiedades"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 
                            hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-medium 
                            transition-all shadow-lg shadow-violet-900/30"
                >
                  <FaSearch className="w-4 h-4" />
                  Explorar propiedades
                </Link>
              )}
            </div>
          )}

          {/* Lista */}
          {alertasFiltradas.length > 0 && (
            <div className="space-y-4">
              {alertasFiltradas.map((alerta) => (
                <AlertaCard
                  key={alerta._id}
                  alerta={alerta}
                  onToggle={() => toggleActivo(alerta._id, alerta.activo)}
                  onDelete={() => eliminarAlerta(alerta._id)}
                  loading={actionLoading === alerta._id}
                />
              ))}
            </div>
          )}
        </main>

        {/* 📌 Footer informativo */}
        <footer className="mt-12 text-center">
          <p className={`${theme.textSecondary} text-xs`}>
            Las alertas se envían según la frecuencia configurada. 
            <br className="sm:hidden" />
            ¿Necesitás ayuda? <Link href="/contact" className={`${theme.textAccent} hover:underline`}>Contactanos</Link>.
          </p>
        </footer>
      </div>
    </div>
  );
}

// 🔹 Componente Card para cada alerta (extraído para mejor organización)
function AlertaCard({ 
  alerta, 
  onToggle, 
  onDelete, 
  loading 
}: { 
  alerta: Alerta; 
  onToggle: () => void; 
  onDelete: () => void;
  loading: boolean;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  
  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Obtener texto descriptivo según tipo de alerta
  const getDescripcion = () => {
    if (alerta.tipo === 'propiedad' && alerta.propiedad) {
      const { titulo, direccion, precio } = alerta.propiedad;
      const ubicacion = direccion ? `${direccion.barrio}${direccion.ciudad ? `, ${direccion.ciudad}` : ''}` : '';
      const precioText = precio?.monto ? `$${precio.monto.toLocaleString('es-AR')} ${precio.moneda}` : 'Consultar';
      return { titulo: titulo || 'Propiedad', subtitle: `${ubicacion} · ${precioText}` };
    }
    if (alerta.tipo === 'busqueda' && alerta.criterios) {
      const { tipoOperacion, tipoPropiedad, ubicacion } = alerta.criterios;
      const props = tipoPropiedad?.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') || 'Cualquier tipo';
      const zona = ubicacion?.ciudad || ubicacion?.barrio?.[0] || 'Todas las zonas';
      const operacion = tipoOperacion === 'venta' ? 'Venta' : tipoOperacion === 'alquiler' ? 'Alquiler' : 'Venta/Alquiler';
      return { titulo: `Búsqueda: ${props}`, subtitle: `${operacion} · ${zona}` };
    }
    return { titulo: 'Alerta', subtitle: '' };
  };

  const { titulo, subtitle } = getDescripcion();

  return (
    <div className={`${theme.bgCard} ${theme.border} rounded-2xl p-5 ${theme.shadow} 
                    hover:${theme.borderHover} hover:bg-slate-800/90 transition-all duration-300`}>
      
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        
        {/* Imagen (si es propiedad) */}
        {alerta.propiedad?.imagen && (
          <div className="flex-shrink-0">
            <img
              src={alerta.propiedad.imagen}
              alt={alerta.propiedad.titulo}
              className="w-20 h-20 object-cover rounded-xl border border-slate-700/50"
            />
          </div>
        )}
        
        {/* Icono fallback si no hay imagen */}
        {!alerta.propiedad?.imagen && alerta.tipo === 'propiedad' && (
          <div className={`flex-shrink-0 w-20 h-20 rounded-xl ${theme.bgCard} ${theme.border} 
                        flex items-center justify-center`}>
            <FaBell className={`w-8 h-8 ${theme.textAccent}`} />
          </div>
        )}
        {!alerta.propiedad?.imagen && alerta.tipo === 'busqueda' && (
          <div className={`flex-shrink-0 w-20 h-20 rounded-xl ${theme.bgCard} ${theme.border} 
                        flex items-center justify-center`}>
            <FaSearch className={`w-8 h-8 ${theme.textAccent}`} />
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} truncate`}>
                {titulo}
              </h3>
              <p className={`text-sm ${theme.textSecondary} mt-1`}>
                {subtitle}
              </p>
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  alerta.activo 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}>
                  {alerta.activo ? <FaCheckCircle className="w-3 h-3 mr-1" /> : <FaExclamationTriangle className="w-3 h-3 mr-1" />}
                  {alerta.activo ? 'Activa' : 'Pausada'}
                </span>
                
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                  {alerta.frecuencia === 'inmediato' ? '⚡ Inmediato' : 
                   alerta.frecuencia === 'diario' ? '📅 Diario' : '🗓️ Semanal'}
                </span>
                
                {alerta.totalEnvios > 0 && (
                  <span className={`text-xs ${theme.textSecondary}`}>
                    {alerta.totalEnvios} envío{alerta.totalEnvios > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {/* Acciones */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Toggle activo/inactivo */}
              <button
                onClick={onToggle}
                disabled={loading}
                className={`p-2 rounded-lg transition-all ${
                  alerta.activo 
                    ? 'text-emerald-400 hover:bg-emerald-500/20' 
                    : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
                } disabled:opacity-60`}
                title={alerta.activo ? 'Pausar alerta' : 'Activar alerta'}
              >
                {loading ? (
                  <FaSpinner className="w-5 h-5 animate-spin" />
                ) : alerta.activo ? (
                  <FaToggleOn className="w-6 h-6" />
                ) : (
                  <FaToggleOff className="w-6 h-6" />
                )}
              </button>
              
              {/* Link a propiedad (si aplica) */}
              {alerta.propiedad?._id && (
                <Link
                  href={`/propiedades/${alerta.propiedad.seo?.slug}`}

                  
                  onClick={e => {
                    e.stopPropagation();
                  }}

                  className={`p-2 rounded-lg ${theme.textSecondary} hover:${theme.textAccent} 
                            hover:bg-slate-700/50 transition-all`}
                  title="Ver propiedad"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              )}
              
              {/* Eliminar */}
              <button
                onClick={onDelete}
                disabled={loading}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 
                          transition-all disabled:opacity-60"
                title="Eliminar alerta"
              >
                {loading ? (
                  <FaSpinner className="w-5 h-5 animate-spin" />
                ) : (
                  <FaTrash className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Info adicional */}
          <div className={`mt-4 pt-4 border-t ${theme.border} flex flex-wrap items-center gap-4 text-xs ${theme.textSecondary}`}>
            <span>Creada: {formatDate(alerta.createdAt)}</span>
            {alerta.ultimoEnvio && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>Último envío: {formatDate(alerta.ultimoEnvio)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🔹 Exportar página con Suspense boundary
export default function AlertasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    }>
      <AlertasContent />
    </Suspense>
  );
}