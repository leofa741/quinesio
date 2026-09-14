// app/app/gestion/propiedades/[id]/page.tsx
'use client';

import { useEffect, useState, Suspense, JSX } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { 
    FaHome, FaMapMarkerAlt, FaMoneyBillWave, FaUser, FaBuilding, 
    FaPhone, FaEnvelope, FaCalendarAlt, FaArrowLeft, FaEdit, FaTrash,
    FaStar, FaRegStar, FaImages, FaVideo, FaFilePdf, FaShareAlt,
    FaChevronLeft, FaChevronRight, FaExpand, FaCompress
} from 'react-icons/fa';
import { Pencil, Trash2, Eye, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatARS } from '@/app/lib/formatcurrenci';

// ─────────────────────────────────────────────────────────────
// 🔹 Tipos
// ─────────────────────────────────────────────────────────────

interface Propietario {
  _id: string;
  razonSocial: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

interface Agente {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface ImagenProperty {
  url: string;
  descripcion?: string;
  principal: boolean;
  orden: number;
  tipo: 'foto' | 'plano' | 'video_thumbnail';
}

interface VisitaProgramada {
  _id?: string;
  fecha: string;
  cliente?: { _id: string; nombre: string };
  estado: 'pendiente' | 'confirmada' | 'realizada' | 'cancelada';
}

interface Property {
  _id: string;
  titulo: string;
  descripcion: string;
  codigoInterno?: string;
 tipoPropiedad: 'departamento' | 'casa' | 'local' | 'oficina' | 'terreno' | 'campo' | 'barrio cerrado' | 'urbanizacion protegida' | 'galpon' | 'ph';
  tipoOperacion: 'venta' | 'alquiler' | 'ambos';
  categoria: 'residencial' | 'comercial' | 'industrial' | 'inversion';
  direccion: {
    calle: string;
    numero: string;
    piso?: string;
    depto?: string;
    barrio: string;
    ciudad: string;
    provincia: string;
    codigoPostal?: string;
    coordenadas?: { lat: number; lng: number };
    mostrarDireccionExacta: boolean;
  };
  zona?: string;
  caracteristicas: {
    ambientes?: number;
    dormitorios?: number;
    banios?: number;
    toilets?: number;
    cochera?: boolean;
    cocheras?: number;
    metrosCubiertos?: number;
    metrosTotales?: number;
    metrosTerreno?: number;
    piso?: number;
    orientacion?: string;
    antiguedad?: number;
    estadoConservacion?: 'nuevo' | 'excelente' | 'bueno' | 'regular' | 'a renovar';
    balcon?: boolean;
    terraza?: boolean;
    patio?: boolean;
    pileta?: boolean;
    jardin?: boolean;
    ascensor?: boolean;
    seguridad?: boolean;
  };
  precios: {
    venta?: { moneda: 'ARS' | 'USD'; monto?: number; comision?: number; gastosEscrituracion?: boolean };
    alquiler?: { moneda: 'ARS' | 'USD'; monto?: number; comision?: number; ajuste?: string; garantiaRequerida?: string };
    expensas?: number;
    impuestos?: number;
  };
  imagenes: ImagenProperty[];
  videoUrl?: string;
  tourVirtualUrl?: string;
  planoUrl?: string;
  estado: 'borrador' | 'publicado' | 'reservado' | 'alquilado' | 'vendido' | 'baja';
  fechaPublicacion?: string;
  fechaDisponibilidad?: string;
  destacado: boolean;
  urgente: boolean;
  propietario: Propietario | string;
  agente: Agente | string;
  notasInternas?: string;
  visitasProgramadas?: VisitaProgramada[];
  activo: boolean;
  seo?: { slug?: string; metaTitle?: string; metaDescription?: string };
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// 🎨 Sistema de diseño premium
// ─────────────────────────────────────────────────────────────

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  bgCardHover: 'bg-slate-800/90',
  border: 'border-slate-700/50',
  borderHover: 'border-violet-500/40',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
  textAccent: 'text-violet-400',
  gradient: 'from-violet-600/20 via-purple-600/20 to-indigo-600/20',
  gradientBorder: 'from-violet-500 via-purple-500 to-indigo-500',
  shadow: 'shadow-2xl shadow-violet-900/20',
  shadowHover: 'shadow-violet-900/40',
};

// ─────────────────────────────────────────────────────────────
// 🔹 Helpers de formato
// ─────────────────────────────────────────────────────────────

const formatPrice = (monto?: number, moneda: 'ARS' | 'USD' = 'USD') => {
  if (!monto) return 'Consultar';
  if (moneda === 'ARS') return formatARS(monto);
  return `$ ${monto.toLocaleString('es-AR')} ${moneda}`;
};

const getEstadoBadge = (estado: Property['estado']) => {
  const styles: Record<Property['estado'], { bg: string; text: string; label: string; dot: string }> = {
    borrador: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Borrador', dot: 'bg-slate-500' },
    publicado: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Publicado', dot: 'bg-emerald-500' },
    reservado: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Reservado', dot: 'bg-amber-500' },
    alquilado: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Alquilado', dot: 'bg-blue-500' },
    vendido: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Vendido', dot: 'bg-purple-500' },
    baja: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Baja', dot: 'bg-rose-500' },
  };
  return styles[estado] || styles.borrador;
};

const getTipoPropiedadIcon = (tipo: Property['tipoPropiedad']) => {
  const icons: Record<Property['tipoPropiedad'], JSX.Element> = {
    departamento: <FaBuilding className="w-5 h-5" />,
    casa: <FaHome className="w-5 h-5" />,
    local: <FaBuilding className="w-5 h-5" />,
    oficina: <FaBuilding className="w-5 h-5" />,
    terreno: <FaMapMarkerAlt className="w-5 h-5" />,
    campo: <FaMapMarkerAlt className="w-5 h-5" />,
    'barrio cerrado': <FaHome className="w-5 h-5" />,
    'urbanizacion protegida': <FaHome className="w-5 h-5" />,
    galpon: <FaBuilding className="w-5 h-5" />,
    ph: <FaHome className="w-5 h-5" />,
  };
  return icons[tipo] || <FaHome className="w-5 h-5" />;
};

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal con Suspense
// ─────────────────────────────────────────────────────────────

export default function PropiedadDetallePage() {
  return (
    <Suspense fallback={<div className={`${theme.bg} min-h-screen flex items-center justify-center`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-violet-500 border-r-purple-500 mx-auto mb-4" />
        <p className={`${theme.textSecondary}`}>Cargando propiedad...</p>
      </div>
    </div>}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  // ─────────────────────────────────────────────────────────────
  // 🎣 Hooks y Estados
  // ─────────────────────────────────────────────────────────────
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // ─────────────────────────────────────────────────────────────
  // 🔒 Validación de acceso
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const validateAccess = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') { router.push('/'); return; }
      
      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) { toast.error('Acceso denegado'); router.push('/'); return; }
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role || session?.user?.role;
        if (!['admin', 'superadmin', 'agente', 'vendedor'].includes(role)) {
          toast.error('Acceso restringido'); router.push('/'); return;
        }
        setIsAuthorized(true);
        setUserRole(role);
      } catch {
        toast.error('Sesión inválida'); router.push('/');
      }
    };
    validateAccess();
  }, [status, session, router]);

  // ─────────────────────────────────────────────────────────────
  // 📥 Cargar propiedad
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthorized || !id) return;
    
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/gestion/propiedades/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error('Propiedad no encontrada');
            router.push('/gestion/propiedades');
          } else {
            toast.error('Error al cargar la propiedad');
          }
          return;
        }
        const data = await res.json();
        setProperty(data);
        // Encontrar índice de imagen principal
        const principalIndex = data.imagenes?.findIndex((img: any) => img.principal);
        if (principalIndex !== -1) setActiveImageIndex(principalIndex);
      } catch (err) {
        console.error('Error fetching property:', err);
        toast.error('Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [isAuthorized, id, router]);

  // ─────────────────────────────────────────────────────────────
  // 📡 SSE: Escuchar actualizaciones en tiempo real
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthorized || !id) return;
    
    const eventSource = new EventSource('/api/gestion/propiedades/events');
    
    eventSource.onmessage = (event) => {
      if (!event.data || event.data === 'ping') return;
      try {
        const parsed = JSON.parse(event.data);
        if ((parsed.type === 'propiedad_actualizada' || parsed.type === 'propiedad_estado_cambiado') && parsed.data._id === id) {
          setProperty(prev => prev ? { ...prev, ...parsed.data } : null);
          toast.info('Propiedad actualizada');
        }
      } catch (err) {
        console.error('Error SSE:', err);
      }
    };
    
    return () => eventSource.close();
  }, [isAuthorized, id]);

  // ─────────────────────────────────────────────────────────────
  // 🎯 Acciones
  // ─────────────────────────────────────────────────────────────
  if (!isAuthorized || loading) return null;
  if (!property) return (
    <div className={`${theme.bg} min-h-screen flex items-center justify-center`}>
      <p className={`${theme.textSecondary}`}>Propiedad no encontrada</p>
    </div>
  );

  const estadoStyle = getEstadoBadge(property.estado);
  const imagenesOrdenadas = [...(property.imagenes || [])].sort((a, b) => a.orden - b.orden);
  const imagenPrincipal = imagenesOrdenadas[activeImageIndex] || imagenesOrdenadas[0];

  const cambiarEstado = async (nuevoEstado: Property['estado']) => {
    Swal.fire({
      title: `¿Cambiar estado a "${nuevoEstado}"?`,
      text: 'Esta acción puede afectar la visibilidad de la propiedad.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/gestion/propiedades/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado }),
          });
          if (res.ok) {
            const updated = await res.json();
            setProperty(updated);
            toast.success(`Estado cambiado a "${nuevoEstado}"`);
          } else {
            toast.error('Error al cambiar estado');
          }
        } catch {
          toast.error('Error de conexión');
        }
      }
    });
  };

  const toggleDestacado = async () => {
    try {
      const res = await fetch(`/api/gestion/propiedades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destacado: !property.destacado }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProperty(updated);
        toast.success(property.destacado ? 'Quitado de destacados' : 'Agregado a destacados');
      }
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const deleteProperty = async () => {
    Swal.fire({
      title: '¿Dar de baja esta propiedad?',
      text: 'La propiedad se marcará como inactiva pero podrá recuperarse desde el listado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/gestion/propiedades/${id}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success('Propiedad dada de baja');
            router.push('/gestion/propiedades');
          } else {
            toast.error('Error al eliminar');
          }
        } catch {
          toast.error('Error de conexión');
        }
      }
    });
  };

  const compartirPropiedad = async () => {
    const url = `${window.location.origin}/propiedad/${property.seo?.slug || property._id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 🎨 JSX Principal
  // ─────────────────────────────────────────────────────────────
  return (
    <div className={`${theme.bg} ${theme.textPrimary} min-h-screen relative overflow-hidden`}>
        <br />
        <br />
        <br />
       
      
      {/* ✨ Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-20`} />
        <div className={`absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl opacity-15`} />
      </div>

      {/* 🚨 Espacio para navbar */}
      <div className="pt-24 lg:pt-28" />

      <div className="relative z-10 px-4 md:px-8 pb-12">
        
        {/* 🏷️ Header con breadcrumb y acciones */}
        <header className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Breadcrumb + Título */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link 
                href="/gestion/propiedades" 
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.textSecondary} hover:${theme.textAccent} transition-all text-sm`}
              >
                <FaArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <span className={`${theme.textSecondary}`}>/</span>
              <span className="text-sm text-slate-400">Propiedades</span>
              <span className={`${theme.textSecondary}`}>/</span>
              <span className="text-sm text-white font-medium truncate max-w-[200px]">{property.titulo}</span>
            </div>

            {/* Acciones principales */}
            <div className="flex items-center gap-2">
              {/* Toggle Destacado */}
              <button
                onClick={toggleDestacado}
                className={`p-2.5 rounded-xl border transition-all ${
                  property.destacado 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
                }`}
                title={property.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
              >
                {property.destacado ? <FaStar className="w-4 h-4" /> : <FaRegStar className="w-4 h-4" />}
              </button>
              
              {/* Compartir 
              <button
                onClick={compartirPropiedad}
                className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all"
                title="Copiar enlace"
              >
                <FaShareAlt className="w-4 h-4" />
              </button>*/}
              
              {/* Editar */}
              <Link
                href={`/gestion/propiedades/editar/${property._id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50"
              >
                <FaEdit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </Link>
              
              {/* Eliminar */}
              <button
                onClick={deleteProperty}
                className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                title="Dar de baja"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* 📋 Contenido Principal - Grid Layout */}
        <main className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 👈 Columna Izquierda: Galería + Info Principal (2/3) */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* 🖼️ Galería de Imágenes */}
            <section className={`${theme.bgCard} ${theme.border} rounded-2xl overflow-hidden backdrop-blur-sm ${theme.shadow}`}>
              
              {/* Imagen Principal */}
              <div className="relative aspect-video lg:aspect-[16/10] bg-slate-800 group">
                {imagenPrincipal?.url ? (
                  <>
                    <img 
                      src={imagenPrincipal.url} 
                      alt={imagenPrincipal.descripcion || property.titulo}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay con info de imagen */}
                    {imagenPrincipal.descripcion && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4">
                        <p className="text-white text-sm">{imagenPrincipal.descripcion}</p>
                      </div>
                    )}
                    {/* Badge de tipo de imagen */}
                    {imagenPrincipal.tipo !== 'foto' && (
                      <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-medium bg-violet-500/90 text-white">
                        {imagenPrincipal.tipo === 'plano' ? '📐 Plano' : '🎬 Video'}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <FaImages className="w-16 h-16 opacity-50" />
                  </div>
                )}
                
                {/* Controles de navegación */}
                {imagenesOrdenadas.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex(i => Math.max(0, i - 1))}
                      disabled={activeImageIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <FaChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex(i => Math.min(imagenesOrdenadas.length - 1, i + 1))}
                      disabled={activeImageIndex === imagenesOrdenadas.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <FaChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {/* Botón fullscreen */}
                <button
                  onClick={() => setIsFullscreenGallery(true)}
                  className="absolute top-4 left-4 p-2 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100"
                  title="Ver en pantalla completa"
                >
                  <FaExpand className="w-4 h-4" />
                </button>
                
                {/* Contador de imágenes */}
                <span className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-900/80 text-slate-300">
                  {activeImageIndex + 1} / {imagenesOrdenadas.length}
                </span>
              </div>

              {/* Thumbnails */}
              {imagenesOrdenadas.length > 1 && (
                <div className="p-4 border-t border-slate-700/50">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {imagenesOrdenadas.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImageIndex === index 
                            ? 'border-violet-500 ring-2 ring-violet-500/30' 
                            : 'border-transparent hover:border-slate-500'
                        }`}
                      >
                        <img 
                          src={img.url} 
                          alt={img.descripcion || `Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img.principal && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                            <FaStar className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 📝 Descripción y Detalles */}
            <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaFilePdf className="text-violet-400" />
                Descripción
              </h2>
              <p className={`${theme.textSecondary} leading-relaxed whitespace-pre-wrap`}>
                {property.descripcion}
              </p>
              
              {/* Multimedia adicional */}
              {(property.videoUrl || property.tourVirtualUrl || property.planoUrl) && (
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Multimedia adicional</h3>
                  <div className="flex flex-wrap gap-3">
                    {property.videoUrl && (
                      <a 
                        href={property.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm"
                      >
                        <FaVideo className="w-4 h-4" />
                        Ver video
                      </a>
                    )}
                    {property.tourVirtualUrl && (
                      <a 
                        href={property.tourVirtualUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all text-sm"
                      >
                        <FaExpand className="w-4 h-4" />
                        Tour virtual
                      </a>
                    )}
                    {property.planoUrl && (
                      <a 
                        href={property.planoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-sm"
                      >
                        <FaFilePdf className="w-4 h-4" />
                        Ver plano
                      </a>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* 🏠 Características - Grid de Stats */}
            <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaHome className="text-violet-400" />
                Características
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {property.caracteristicas.ambientes && (
                  <StatCard label="Ambientes" value={property.caracteristicas.ambientes} icon="🏠" />
                )}
                {property.caracteristicas.dormitorios && (
                  <StatCard label="Dormitorios" value={property.caracteristicas.dormitorios} icon="🛏️" />
                )}
                {property.caracteristicas.banios && (
                  <StatCard label="Baños" value={property.caracteristicas.banios} icon="🚿" />
                )}
                {property.caracteristicas.toilets && (
                  <StatCard label="Toilets" value={property.caracteristicas.toilets} icon="🚽" />
                )}
                {property.caracteristicas.metrosCubiertos && (
                  <StatCard label="M² Cubiertos" value={`${property.caracteristicas.metrosCubiertos} m²`} icon="📐" />
                )}
                {property.caracteristicas.metrosTotales && (
                  <StatCard label="M² Totales" value={`${property.caracteristicas.metrosTotales} m²`} icon="📏" />
                )}
                {property.caracteristicas.cocheras !== undefined && (
                  <StatCard label="Cocheras" value={property.caracteristicas.cocheras} icon="🚗" />
                )}
                {property.caracteristicas.piso !== undefined && property.caracteristicas.piso >= 0 && (
                  <StatCard label="Piso" value={property.caracteristicas.piso} icon="🏢" />
                )}
                {property.caracteristicas.antiguedad && (
                  <StatCard label="Antigüedad" value={`${property.caracteristicas.antiguedad} años`} icon="📅" />
                )}
                {property.caracteristicas.estadoConservacion && (
                  <StatCard label="Estado" value={property.caracteristicas.estadoConservacion} icon="✨" />
                )}
                {property.caracteristicas.orientacion && (
                  <StatCard label="Orientación" value={property.caracteristicas.orientacion} icon="🧭" />
                )}
              </div>

              {/* Extras como badges */}
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Extras</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    property.caracteristicas.balcon && '🪟 Balcón',
                    property.caracteristicas.terraza && '🌿 Terraza',
                    property.caracteristicas.patio && '🏡 Patio',
                    property.caracteristicas.pileta && '🏊 Pileta',
                    property.caracteristicas.jardin && '🌳 Jardín',
                    property.caracteristicas.ascensor && '🛗 Ascensor',
                    property.caracteristicas.seguridad && '🔒 Seguridad',
                    property.caracteristicas.cochera && '🚘 Cochera',
                  ].filter(Boolean).map((extra, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300 border border-slate-600/30">
                      {extra}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* 📍 Ubicación */}
            <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-violet-400" />
                Ubicación
              </h2>
              
              <div className="space-y-3">
                <p className={`${theme.textSecondary}`}>
                  {property.direccion.calle} {property.direccion.numero}
                  {property.direccion.piso && `, Piso ${property.direccion.piso}`}
                  {property.direccion.depto && `, Depto ${property.direccion.depto}`}
                </p>
                <p className="text-white font-medium">
                  {property.direccion.barrio}, {property.direccion.ciudad}, {property.direccion.provincia}
                  {property.direccion.codigoPostal && ` (${property.direccion.codigoPostal})`}
                </p>
                {property.zona && (
                  <p className="text-sm text-violet-400">📍 Zona: {property.zona}</p>
                )}
                
                {/* Nota de privacidad */}
                {!property.direccion.mostrarDireccionExacta && (
                  <p className="text-xs text-slate-500 italic mt-2">
                    ℹ️ Dirección aproximada por privacidad. Contacto para coordenadas exactas.
                  </p>
                )}
                
                {/* Coordenadas si están disponibles */}
                {property.direccion.coordenadas && (
                  <p className="text-xs text-slate-500 font-mono">
                    📍 {property.direccion.coordenadas.lat?.toFixed(4)}, {property.direccion.coordenadas.lng?.toFixed(4)}
                  </p>
                )}
              </div>
            </section>

            {/* 👥 Notas Internas (solo admin/agente) */}
            {['admin', 'superadmin', 'agente'].includes(userRole) && property.notasInternas && (
              <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm border-l-4 border-l-violet-500`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Notas Internas
                  </h2>
                  <button
                    onClick={() => setShowAllNotes(!showAllNotes)}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {showAllNotes ? 'Ver menos' : 'Ver todo'}
                  </button>
                </div>
                <p className={`${theme.textSecondary} text-sm leading-relaxed ${!showAllNotes ? 'line-clamp-3' : ''}`}>
                  {property.notasInternas}
                </p>
              </section>
            )}
          </div>

          {/* 👉 Columna Derecha: Precios + Info Comercial + Agenda (1/3) */}
          <div className="space-y-6">
            
            {/* 💰 Precios Card */}
            <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm ${theme.shadow}`}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaMoneyBillWave className="text-emerald-400" />
                Condiciones Comerciales
              </h2>
              
              <div className="space-y-5">
                {/* Precio de Venta */}
                {property.tipoOperacion !== 'alquiler' && property.precios.venta?.monto && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Venta</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                        {property.precios.venta.moneda}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">
                      {formatPrice(property.precios.venta.monto, property.precios.venta.moneda)}
                    </p>
                    {property.precios.venta.comision && (
                      <p className="text-xs text-slate-500 mt-1">
                        Comisión inmobiliaria: <span className="text-slate-300">{property.precios.venta.comision}%</span>
                      </p>
                    )}
                    {property.precios.venta.gastosEscrituracion !== undefined && (
                      <p className="text-xs text-slate-500">
                        Gastos de escrituración: <span className="text-slate-300">{property.precios.venta.gastosEscrituracion ? 'Incluidos' : 'No incluidos'}</span>
                      </p>
                    )}
                  </div>
                )}
                
                {/* Precio de Alquiler */}
                {property.tipoOperacion !== 'venta' && property.precios.alquiler?.monto && (
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Alquiler</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400">
                        {property.precios.alquiler.moneda}/mes
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">
                      {formatPrice(property.precios.alquiler.monto, property.precios.alquiler.moneda)}
                    </p>
                    {property.precios.alquiler.comision && (
                      <p className="text-xs text-slate-500 mt-1">
                        Comisión: <span className="text-slate-300">{property.precios.alquiler.comision}%</span>
                      </p>
                    )}
                    {property.precios.alquiler.ajuste && (
                      <p className="text-xs text-slate-500">
                        Ajuste: <span className="text-slate-300 capitalize">{property.precios.alquiler.ajuste}</span>
                      </p>
                    )}
                    {property.precios.alquiler.garantiaRequerida && (
                      <p className="text-xs text-slate-500">
                        Garantía: <span className="text-slate-300 capitalize">{property.precios.alquiler.garantiaRequerida}</span>
                      </p>
                    )}
                  </div>
                )}
                
                {/* Expensas e Impuestos */}
                {(property.precios.expensas || property.precios.impuestos) && (
                  <div className="pt-4 border-t border-slate-700/50 space-y-2">
                    {property.precios.expensas && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Expensas</span>
                        <span className="text-slate-300">{formatARS(property.precios.expensas)}</span>
                      </div>
                    )}
                    {property.precios.impuestos && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Impuestos</span>
                        <span className="text-slate-300">{formatARS(property.precios.impuestos)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 🏷️ Estado y Metadata */}
            <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold text-white mb-4">Estado y Metadata</h2>
              
              <div className="space-y-4">
                {/* Badge de estado + selector */}
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Estado</label>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${estadoStyle.bg} ${estadoStyle.text} border border-transparent`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${estadoStyle.dot}`} />
                      {estadoStyle.label}
                    </span>
                    
                    <select
                      value={property.estado}
                      onChange={(e) => cambiarEstado(e.target.value as Property['estado'])}
                      className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500"
                    >
                      <option value="borrador">Borrador</option>
                      <option value="publicado">Publicado</option>
                      <option value="reservado">Reservado</option>
                      <option value="alquilado">Alquilado</option>
                      <option value="vendido">Vendido</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>
                </div>
                
                {/* Fechas */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Publicación</p>
                    <p className="text-slate-300">
                      {property.fechaPublicacion ? new Date(property.fechaPublicacion).toLocaleDateString('es-AR') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Disponibilidad</p>
                    <p className="text-slate-300">
                      {property.fechaDisponibilidad ? new Date(property.fechaDisponibilidad).toLocaleDateString('es-AR') : '—'}
                    </p>
                  </div>
                </div>
                
                {/* Código interno y SEO */}
                <div className="pt-3 border-t border-slate-700/50 space-y-2">
                  {property.codigoInterno && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Código Interno</span>
                      <span className="text-slate-300 font-mono">{property.codigoInterno}</span>
                    </div>
                  )}
                  {property.seo?.slug && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Slug SEO</span>
                      <span className="text-violet-400 font-mono truncate max-w-[150px]">{property.seo.slug}</span>
                    </div>
                  )}
                </div>
                
                {/* Badges adicionales */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {property.destacado && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <FaStar className="w-3 h-3" /> Destacada
                    </span>
                  )}
                  {property.urgente && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" /> Urgente
                    </span>
                  )}
                  {!property.activo && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      Inactiva
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* 👥 Equipo: Propietario + Agente */}
            <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm`}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaUser className="text-violet-400" />
                Equipo
              </h2>
              
              <div className="space-y-4">
                {/* Propietario */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Propietario</p>
                  {typeof property.propietario === 'object' ? (
                    <>
                      <p className="text-white font-medium">{property.propietario.razonSocial || `${property.propietario.nombre} ${property.propietario.apellido}`}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {property.propietario.telefono && (
                          <a href={`tel:${property.propietario.telefono}`} className="flex items-center gap-2 text-slate-400 hover:text-violet-400 transition-colors">
                            <FaPhone className="w-3.5 h-3.5" /> {property.propietario.telefono}
                          </a>
                        )}
                        {property.propietario.email && (
                          <a href={`mailto:${property.propietario.email}`} className="flex items-center gap-2 text-slate-400 hover:text-violet-400 transition-colors">
                            <FaEnvelope className="w-3.5 h-3.5" /> {property.propietario.email}
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 text-sm">ID: {property.propietario}</p>
                  )}
                </div>
                
                {/* Agente responsable */}
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Agente Responsable</p>
                  {typeof property.agente === 'object' ? (
                    <>
                      <p className="text-white font-medium">{property.agente.name}</p>
                      <a href={`mailto:${property.agente.email}`} className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors mt-1">
                        <FaEnvelope className="w-3.5 h-3.5" /> {property.agente.email}
                      </a>
                    </>
                  ) : (
                    <p className="text-slate-400 text-sm">ID: {property.agente}</p>
                  )}
                </div>
              </div>
            </section>

            {/* 📅 Visitas Programadas (solo si hay) */}
            {property.visitasProgramadas && property.visitasProgramadas.length > 0 && (
              <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm`}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-violet-400" />
                  Visitas Programadas
                </h2>
                
                <div className="space-y-3">
                  {property.visitasProgramadas.map((visita, i) => (
                    <div key={visita._id || i} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-medium">
                          {new Date(visita.fecha).toLocaleDateString('es-AR', { 
                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          visita.estado === 'confirmada' ? 'bg-emerald-500/10 text-emerald-400' :
                          visita.estado === 'realizada' ? 'bg-blue-500/10 text-blue-400' :
                          visita.estado === 'cancelada' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {visita.estado.charAt(0).toUpperCase() + visita.estado.slice(1)}
                        </span>
                      </div>
                      {visita.cliente && (
                        <p className="text-xs text-slate-400 mt-1">👤 {visita.cliente.nombre}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 📊 Timestamps */}
            <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-4 backdrop-blur-sm`}>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Creada: {new Date(property.createdAt).toLocaleDateString('es-AR')}</span>
                <span>Actualizada: {new Date(property.updatedAt).toLocaleDateString('es-AR')}</span>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* 🖼️ Modal de Galería Fullscreen */}
      {isFullscreenGallery && imagenesOrdenadas.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center"
          onClick={() => setIsFullscreenGallery(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsFullscreenGallery(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Imagen principal fullscreen */}
          <div className="relative max-w-6xl max-h-[90vh] w-full px-4">
            <img 
              src={imagenesOrdenadas[activeImageIndex].url} 
              alt={imagenesOrdenadas[activeImageIndex].descripcion || property.titulo}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Info de imagen */}
            {imagenesOrdenadas[activeImageIndex].descripcion && (
              <p className="text-center text-white mt-3 text-sm">{imagenesOrdenadas[activeImageIndex].descripcion}</p>
            )}
            
            {/* Navegación */}
            {imagenesOrdenadas.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => Math.max(0, i - 1)); }}
                  disabled={activeImageIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
                >
                  <FaChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => Math.min(imagenesOrdenadas.length - 1, i + 1)); }}
                  disabled={activeImageIndex === imagenesOrdenadas.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
                >
                  <FaChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            {/* Thumbnails en fullscreen */}
            {imagenesOrdenadas.length > 1 && (
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
                {imagenesOrdenadas.map((img, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(index); }}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === index ? 'border-violet-500' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🔹 Sub-componente: StatCard para características
// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center hover:bg-slate-800/60 transition-colors">
      <span className="text-lg mb-1 block">{icon}</span>
      <p className="text-white font-semibold text-sm">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}