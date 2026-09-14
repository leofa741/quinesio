// app/app/gestion/propiedades/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { FaHome, FaPlus, FaSearch, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';
import { Pencil, Trash2, Eye, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, ArrowLeft, RotateCcw } from 'lucide-react';
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
}

interface ImagenProperty {
    url: string;
    descripcion?: string;
    principal: boolean;
    orden: number;
    tipo: 'foto' | 'plano' | 'video_thumbnail';
}

interface Property {
    _id: string;
    titulo: string;
    descripcion: string;
    codigoInterno?: string;
    tipoPropiedad: 'departamento' | 'casa' | 'local' | 'oficina' | 'terreno' | 'cochera' | 'galpon' | 'ph';
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
    };
    zona?: string;
    caracteristicas: {
        ambientes?: number;
        dormitorios?: number;
        banios?: number;
        metrosCubiertos?: number;
        metrosTotales?: number;
        cochera?: boolean;
        balcon?: boolean;
        pileta?: boolean;
    };
    precios: {
        venta?: { moneda: 'ARS' | 'USD'; monto?: number; comision?: number };
        alquiler?: { moneda: 'ARS' | 'USD'; monto?: number; comision?: number };
        expensas?: number;
    };
    imagenes: ImagenProperty[];
    estado: 'borrador' | 'publicado' | 'reservado' | 'alquilado' | 'vendido' | 'baja';
    destacado: boolean;
    urgente: boolean;
    activo: boolean;
    propietario: Propietario | string;
    agente: Agente | string;
    fechaPublicacion?: string;
    seo?: { slug?: string };
    createdAt: string;
    updatedAt: string;
}

interface PropertyResponse {
    propiedades: Property[];
    total: number;
    page: number;
    totalPages: number;
}

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Skeleton Loader Premium para la tabla
// ─────────────────────────────────────────────────────────────

function PropertiesTableSkeleton() {
    return (
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden backdrop-blur-sm animate-pulse">


            <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                    <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="text-left py-3 px-4">Propiedad</th>
                            <th className="text-left py-3 px-4">Ubicación</th>
                            <th className="text-left py-3 px-4">Características</th>
                            <th className="text-left py-3 px-4">Venta</th>
                            <th className="text-left py-3 px-4">Alquiler</th>
                            <th className="text-left py-3 px-4">Estado</th>
                            <th className="text-left py-3 px-4">Agente</th>
                            <th className="text-left py-3 px-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {[...Array(5)].map((_, index) => (
                            <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                                {/* 👤 Propiedad + Imagen placeholder */}
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-lg bg-slate-700/50 flex-shrink-0" />
                                        <div className="min-w-0 space-y-2">
                                            <div className="h-4 bg-slate-700/50 rounded w-32" />
                                            <div className="h-3 bg-slate-700/50 rounded w-20" />
                                        </div>
                                    </div>
                                </td>

                                {/* 📍 Ubicación placeholder */}
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 bg-slate-700/50 rounded flex-shrink-0" />
                                        <div className="h-4 bg-slate-700/50 rounded w-24" />
                                    </div>
                                </td>

                                {/* 🏠 Características placeholder */}
                                <td className="py-4 px-4">
                                    <div className="space-y-1.5">
                                        <div className="h-3 bg-slate-700/50 rounded w-16" />
                                        <div className="h-3 bg-slate-700/50 rounded w-20" />
                                    </div>
                                </td>

                                {/* 💰 Precio Venta placeholder */}
                                <td className="py-4 px-4">
                                    <div className="h-4 bg-slate-700/50 rounded w-20" />
                                </td>

                                {/* 💰 Precio Alquiler placeholder */}
                                <td className="py-4 px-4">
                                    <div className="h-4 bg-slate-700/50 rounded w-20" />
                                </td>

                                {/* 🏷️ Estado placeholder */}
                                <td className="py-4 px-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="h-5 bg-slate-700/50 rounded-full w-20" />
                                        <div className="h-4 bg-slate-700/50 rounded w-16" />
                                    </div>
                                </td>

                                {/* 👤 Agente placeholder */}
                                <td className="py-4 px-4">
                                    <div className="space-y-1.5">
                                        <div className="h-4 bg-slate-700/50 rounded w-24" />
                                        <div className="h-3 bg-slate-700/50 rounded w-32" />
                                    </div>
                                </td>

                                {/* ⚡ Acciones placeholder */}
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-1.5">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="w-8 h-8 bg-slate-700/50 rounded-lg" />
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal con Suspense
// ─────────────────────────────────────────────────────────────

export default function PropiedadesPage() {
    return (
        <Suspense fallback={
            <div className="relative min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-40" style={{ filter: 'blur(150px)' }} />
                </div>
                <div className="relative z-10 text-center">
                    <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Cargando propiedades...</p>
                </div>
            </div>
        }>
            <PageContent />
        </Suspense>
    );
}

function PageContent() {
    // ─────────────────────────────────────────────────────────────
    // 🎣 Hooks y Estados
    // ─────────────────────────────────────────────────────────────
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1');
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [propiedades, setPropiedades] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔍 Búsqueda con debounce
    const [internalSearch, setInternalSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Property[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchHint, setSearchHint] = useState<string | null>(null);

    // Determinar qué propiedades mostrar
    const propertiesToShow = internalSearch.trim() ? searchResults : propiedades;

    // Estados para UI condicional
    const shouldShowEmptyState =
        !loading && !searching && internalSearch.trim().length >= 2 && propertiesToShow.length === 0;

    const shouldShowTable = !loading && (internalSearch.trim().length < 2 || propertiesToShow.length > 0);

    // 📄 Paginación
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const limit = 20;

    // 🎛 Filtros adicionales
    const [filtroTipo, setFiltroTipo] = useState<string>('');
    const [filtroOperacion, setFiltroOperacion] = useState<string>('');
    const [filtroBarrio, setFiltroBarrio] = useState<string>('');
    const [filtroEstado, setFiltroEstado] = useState<string>('');

    // 🗑️ Propiedades eliminadas (baja)
    const [propiedadesEliminadas, setPropiedadesEliminadas] = useState<Property[]>([]);
    const [loadingEliminadas, setLoadingEliminadas] = useState(false);
    const [mostrarEliminadas, setMostrarEliminadas] = useState(false);

    // ─────────────────────────────────────────────────────────────
    // 🔍 Efecto: Búsqueda con Debounce (350ms)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!internalSearch.trim()) {
            setSearchResults([]);
            setSearchHint(null);
            return;
        }
        if (internalSearch.trim().length < 2) {
            setSearchResults([]);
            setSearchHint('Escribí al menos 2 caracteres para buscar...');
            return;
        }

        const handler = setTimeout(async () => {
            setSearching(true);
            try {
                const params = new URLSearchParams({ q: internalSearch.trim() });
                if (filtroTipo) params.set('tipoPropiedad', filtroTipo);
                if (filtroOperacion) params.set('tipoOperacion', filtroOperacion);
                if (filtroBarrio) params.set('barrio', filtroBarrio);

                const res = await fetch(`/api/gestion/propiedades/search?${params}`);
                if (!res.ok) throw new Error('Error en la búsqueda');
                const data = await res.json();
                setSearchResults(data.propiedades || []);
                setSearchHint(data.hint || null);
            } catch (err) {
                console.error('Error al buscar propiedades:', err);
                setSearchResults([]);
                setSearchHint('Error al realizar la búsqueda. Intentá nuevamente.');
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => clearTimeout(handler);
    }, [internalSearch, filtroTipo, filtroOperacion, filtroBarrio]);

    // ─────────────────────────────────────────────────────────────
    // 🔒 Validación de acceso (igual que Productos)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const validateAccess = async () => {
            if (status === 'loading') return;
            if (status === 'unauthenticated') { router.push('/'); return; }

            const token = session?.user?.token || localStorage.getItem('token');
            if (!token) { toast.error('Acceso denegado'); router.push('/'); return; }

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (!['admin', 'superadmin', 'agente'].includes(payload.role)) {
                    toast.error('Acceso restringido'); router.push('/'); return;
                }
                setIsAuthorized(true);
            } catch {
                toast.error('Sesión inválida'); router.push('/');
            }
        };
        validateAccess();
    }, [status, session, router]);

    // ─────────────────────────────────────────────────────────────
    // 📥 Cargar propiedades paginadas
    // ─────────────────────────────────────────────────────────────
    const loadPaginatedProperties = async () => {
        if (!isAuthorized) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(currentPage), limit: String(limit) });
            if (filtroTipo) params.set('tipoPropiedad', filtroTipo);
            if (filtroOperacion) params.set('tipoOperacion', filtroOperacion);
            if (filtroBarrio) params.set('barrio', filtroBarrio);
            if (filtroEstado) params.set('estado', filtroEstado);

            const res = await fetch(`/api/gestion/propiedades?${params}`);
            if (res.ok) {
                const data: PropertyResponse = await res.json();
                setPropiedades(data.propiedades);
                setPagination({ total: data.total, page: data.page, totalPages: data.totalPages });
            } else {
                toast.error('Error al cargar propiedades');
            }
        } catch {
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPaginatedProperties();
    }, [currentPage, isAuthorized, filtroTipo, filtroOperacion, filtroBarrio, filtroEstado]);

    // 🗑️ Cargar propiedades eliminadas
    const cargarEliminadas = async () => {
        if (!isAuthorized) return;
        setLoadingEliminadas(true);
        try {
            const res = await fetch('/api/gestion/propiedades?eliminadas=true&all=true');
            if (res.ok) {
                const data = await res.json();
                setPropiedadesEliminadas(data.propiedades || []);
            }
        } catch (err) {
            console.error('Error al cargar propiedades eliminadas:', err);
        } finally {
            setLoadingEliminadas(false);
        }
    };

    useEffect(() => {
        if (mostrarEliminadas) {
            cargarEliminadas();
        }
    }, [mostrarEliminadas, isAuthorized]);

    // ─────────────────────────────────────────────────────────────
    // 📡 SSE: Escuchar eventos en tiempo real
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const eventSource = new EventSource('/api/gestion/propiedades/events');

        eventSource.onmessage = (event) => {
            if (!event.data || event.data === 'ping') return;
            try {
                const parsed = JSON.parse(event.data);

                // ➤ Propiedad creada
                if (parsed.type === 'propiedad_creada') {
                    setPropiedades(prev => [parsed.data, ...prev]);
                    if (internalSearch.trim()) setSearchResults(prev => [parsed.data, ...prev]);
                    toast.success('Propiedad creada correctamente');
                }

                // ➤ Propiedad actualizada
                if (parsed.type === 'propiedad_actualizada' || parsed.type === 'propiedad_estado_cambiado') {
                    const updated = parsed.data;
                    setPropiedades(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
                    if (internalSearch.trim()) {
                        setSearchResults(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
                    }

                    // 👇 Recargar lista de eliminadas si corresponde
                    if (mostrarEliminadas) {
                        cargarEliminadas();
                    }
                }

                // ➤ Propiedad eliminada (soft delete)
                if (parsed.type === 'propiedad_eliminada') {
                    const propId = parsed.data.id;
                    setPropiedades(prev => prev.filter(p => p._id !== propId));
                    if (internalSearch.trim()) setSearchResults(prev => prev.filter(p => p._id !== propId));
                    toast.info('Propiedad eliminada', { autoClose: 3000 });

                    // 👇 Recargar lista de eliminadas
                    if (mostrarEliminadas) {
                        cargarEliminadas();
                    }
                }
            } catch (err) {
                console.error('Error al procesar evento SSE:', err);
            }
        };

        eventSource.onerror = () => {
            console.warn('Conexión SSE perdida');
            eventSource.close();
        };

        return () => eventSource.close();
    }, [internalSearch, mostrarEliminadas]); // 👇 Agregar mostrarEliminadas a las dependencias
    // ─────────────────────────────────────────────────────────────
    // 🧭 Helpers de visualización
    // ─────────────────────────────────────────────────────────────
    if (!isAuthorized) return null;

    const buildUrl = (page: number) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (filtroTipo) params.set('tipoPropiedad', filtroTipo);
        if (filtroOperacion) params.set('tipoOperacion', filtroOperacion);
        return `${pathname}?${params.toString()}`;
    };

    const getEstadoBadge = (estado: Property['estado']) => {
        const styles: Record<Property['estado'], { bg: string; text: string; label: string }> = {
            borrador: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Borrador' },
            publicado: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Publicado' },
            reservado: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Reservado' },
            alquilado: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Alquilado' },
            vendido: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Vendido' },
            baja: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Baja' },
        };
        return styles[estado] || styles.borrador;
    };

    const formatPrice = (monto?: number, moneda: 'ARS' | 'USD' = 'USD') => {
        if (!monto) return 'Consultar';
        if (moneda === 'ARS') return formatARS(monto);
        return `$ ${monto.toLocaleString('es-AR')} ${moneda}`;
    };

    const getImagenPrincipal = (imagenes: ImagenProperty[]) =>
        imagenes.find(img => img.principal)?.url || imagenes[0]?.url;

    const getDireccionCorta = (direccion: Property['direccion']) =>
        `${direccion.barrio}, ${direccion.ciudad}`;

    // ─────────────────────────────────────────────────────────────
    // 🗑️ Eliminar propiedad (soft delete)
    // ─────────────────────────────────────────────────────────────
    const deleteProperty = async (id: string) => {
        Swal.fire({
            title: '¿Dar de baja esta propiedad?',
            text: 'La propiedad se marcará como inactiva pero podrá recuperarse.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar',
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await fetch(`/api/gestion/propiedades/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    toast.success('Propiedad dada de baja');
                    setPropiedades(prev => prev.filter(p => p._id !== id));
                    if (internalSearch.trim()) setSearchResults(prev => prev.filter(p => p._id !== id));

                    // 👇 Recargar la lista de eliminadas
                    if (mostrarEliminadas) {
                        cargarEliminadas();
                    }
                } else {
                    toast.error('Error al eliminar');
                }
            }
        });
    };

    // ─────────────────────────────────────────────────────────────
    // 🔄 Cambiar estado de propiedad
    // ─────────────────────────────────────────────────────────────
    const cambiarEstado = async (propiedad: Property, nuevoEstado: Property['estado']) => {
        try {
            const res = await fetch(`/api/gestion/propiedades/${propiedad._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }),
            });
            if (res.ok) {
                const updated = await res.json();
                setPropiedades(prev => prev.map(p => p._id === propiedad._id ? updated : p));
                if (internalSearch.trim()) setSearchResults(prev => prev.map(p => p._id === propiedad._id ? updated : p));
                toast.success(`Estado cambiado a "${nuevoEstado}"`);

                // 👇 Si el nuevo estado es "baja", recargar eliminadas
                if (nuevoEstado === 'baja' && mostrarEliminadas) {
                    cargarEliminadas();
                }

                // 👇 Si cambió de "baja" a otro estado, recargar eliminadas
                if (propiedad.estado === 'baja' && nuevoEstado !== 'baja' && mostrarEliminadas) {
                    cargarEliminadas();
                }
            } else {
                toast.error('Error al cambiar estado');
            }
        } catch {
            toast.error('Error de conexión');
        }
    };

    // ♻️ Restaurar propiedad (cambiar de 'baja' a 'borrador')
    const restaurarPropiedad = async (propiedad: Property) => {
        Swal.fire({
            title: '¿Restaurar esta propiedad?',
            text: `"${propiedad.titulo}" volverá al estado "Borrador" y será visible nuevamente.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, restaurar',
            cancelButtonText: 'Cancelar',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`/api/gestion/propiedades/${propiedad._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: 'borrador', activo: true }),
                    });
                    if (res.ok) {
                        toast.success('Propiedad restaurada correctamente');
                        setPropiedadesEliminadas(prev => prev.filter(p => p._id !== propiedad._id));
                        // Recargar la tabla principal también
                        loadPaginatedProperties();
                    } else {
                        toast.error('Error al restaurar la propiedad');
                    }
                } catch {
                    toast.error('Error de conexión');
                }
            }
        });
    };

    // ─────────────────────────────────────────────────────────────
    // 🎨 JSX Principal
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="relative min-h-screen bg-slate-950 p-4 sm:p-6 md:p-8 pb-[env(safe-area-inset-bottom)]">

            {/* ✨ Background ambiental */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-40" style={{ filter: 'blur(150px)' }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" aria-hidden="true" />
            </div>

            <br />
            <br />
            <br />

            {/* 🔹 Contenido con z-10 */}
            <div className="relative z-10">

                {/* 🏷️ Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pt-4 sm:pt-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                            <FaHome className="text-violet-400" />
                            Gestión de Propiedades
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Administrá inmuebles, precios, estados y condiciones comerciales.
                        </p>
                        <p className="text-slate-400 mt-1">
                            volver a <Link href="/gestion" className="text-violet-400 hover:text-violet-300 underline">Gestión</Link>
                        </p>
                    </div>
                    <Link
                        href="/gestion/propiedades/nuevo"
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 active:scale-[0.98]"
                    >
                        <FaPlus /> Nueva Propiedad
                    </Link>
                </div>

                {/* 🔍 Filtros y Búsqueda */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 mb-6 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                        {/* Búsqueda principal */}
                        <div className="lg:col-span-2 relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={internalSearch}
                                onChange={(e) => setInternalSearch(e.target.value)}
                                placeholder="Buscar por título, barrio, dirección..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                            />
                        </div>

                        {/* Filtro tipo de propiedad */}
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-violet-500/50"
                        >
                            <option value="">Todos los tipos</option>
                            <option value="departamento">Departamento</option>
                            <option value="casa">Casa</option>
                            <option value="local">Local</option>
                            <option value="oficina">Oficina</option>
                            <option value="terreno">Terreno</option>
                            <option value="cochera">Cochera</option>
                        </select>

                        {/* Filtro operación */}
                        <select
                            value={filtroOperacion}
                            onChange={(e) => setFiltroOperacion(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-violet-500/50"
                        >
                            <option value="">Todas las operaciones</option>
                            <option value="venta">Venta</option>
                            <option value="alquiler">Alquiler</option>
                            <option value="ambos">Ambos</option>
                        </select>

                        {/* Filtro barrio */}
                        <input
                            type="text"
                            value={filtroBarrio}
                            onChange={(e) => setFiltroBarrio(e.target.value)}
                            placeholder="Filtrar por barrio..."
                            className="px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>

                    {/* Feedback de búsqueda */}
                    {internalSearch.trim() && (
                        <div className="mt-3 text-sm">
                            {searching && <span className="text-slate-400">🔍 Buscando...</span>}
                            {!searching && searchHint && <span className="text-slate-500 italic">{searchHint}</span>}
                            {!searching && !searchHint && propertiesToShow.length === 0 && (
                                <span className="text-amber-400">No se encontraron propiedades para "{internalSearch}"</span>
                            )}
                            {!searching && propertiesToShow.length > 0 && (
                                <span className="text-violet-400">
                                    {propertiesToShow.length} resultado{propertiesToShow.length !== 1 ? 's' : ''} para "{internalSearch}"
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* 📋 Listado de Propiedades */}
                {loading && !internalSearch.trim() ? (
                    <>
                        {/* Leyenda placeholder */}
                        <div className="mb-4 text-sm text-slate-400">
                            <div className="h-4 bg-slate-700/50 rounded w-48 animate-pulse" />
                        </div>
                        {/* Skeleton de tabla */}
                        <PropertiesTableSkeleton />
                    </>
                ) : shouldShowEmptyState ? (
                    <div className="text-center py-12 text-slate-500">
                        <FaHome className="text-4xl mb-3 mx-auto text-violet-900/30" />
                        <p>No se encontraron propiedades para "{internalSearch}"</p>
                    </div>
                ) : shouldShowTable ? (
                    <>
                        {/* Leyenda de total */}
                        {!internalSearch.trim() && (
                            <div className="mb-4 text-sm text-slate-400">
                                Total de propiedades: <span className="font-semibold text-white">{pagination.total}</span>
                            </div>
                        )}

                        <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px]">
                                    <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="text-left py-3 px-4">Propiedad</th>
                                            <th className="text-left py-3 px-4">Ubicación</th>
                                            <th className="text-left py-3 px-4">Características</th>
                                            <th className="text-left py-3 px-4">Venta</th>
                                            <th className="text-left py-3 px-4">Alquiler</th>
                                            <th className="text-left py-3 px-4">Estado</th>
                                            <th className="text-left py-3 px-4">Agente</th>
                                            <th className="text-left py-3 px-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {propertiesToShow.map((prop) => {
                                            const estadoStyle = getEstadoBadge(prop.estado);
                                            const imgPrincipal = getImagenPrincipal(prop.imagenes);

                                            return (
                                                <tr key={prop._id} className="hover:bg-slate-800/30 transition-colors group">

                                                    {/* 👤 Propiedad + Imagen */}
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                                                                {imgPrincipal ? (
                                                                    <img src={imgPrincipal} alt={prop.titulo} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                                        <FaBuilding className="w-6 h-6" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-white font-medium truncate">{prop.titulo}</p>
                                                                <p className="text-xs text-slate-400 capitalize">{prop.tipoPropiedad}</p>
                                                                {prop.urgente && (
                                                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                                                        <AlertTriangle className="w-3 h-3" /> Urgente
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 📍 Ubicación */}
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-300">
                                                            <FaMapMarkerAlt className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                                            <span className="truncate">{getDireccionCorta(prop.direccion)}</span>
                                                        </div>
                                                        {prop.zona && <p className="text-xs text-slate-500 mt-0.5">{prop.zona}</p>}
                                                    </td>

                                                    {/* 🏠 Características */}
                                                    <td className="py-4 px-4">
                                                        <div className="text-sm text-slate-300 space-y-0.5">
                                                            {prop.caracteristicas.ambientes && (
                                                                <p>{prop.caracteristicas.ambientes} amb.</p>
                                                            )}
                                                            {prop.caracteristicas.dormitorios && (
                                                                <p>{prop.caracteristicas.dormitorios} dorm.</p>
                                                            )}
                                                            {prop.caracteristicas.banios && (
                                                                <p>{prop.caracteristicas.banios} baños</p>
                                                            )}
                                                            {prop.caracteristicas.metrosCubiertos && (
                                                                <p className="text-slate-400">{prop.caracteristicas.metrosCubiertos} m²</p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* 💰 Precio Venta */}
                                                    <td className="py-4 px-4">
                                                        {prop.precios.venta?.monto ? (
                                                            <div>
                                                                <p className="text-emerald-400 font-semibold">
                                                                    {formatPrice(prop.precios.venta.monto, prop.precios.venta.moneda)}
                                                                </p>
                                                                {prop.precios.venta.comision && (
                                                                    <p className="text-[10px] text-slate-500">Comisión: {prop.precios.venta.comision}%</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500 text-sm">—</span>
                                                        )}
                                                    </td>

                                                    {/* 💰 Precio Alquiler */}
                                                    <td className="py-4 px-4">
                                                        {prop.precios.alquiler?.monto ? (
                                                            <div>
                                                                <p className="text-blue-400 font-semibold">
                                                                    {formatPrice(prop.precios.alquiler.monto, prop.precios.alquiler.moneda)}/mes
                                                                </p>
                                                                {prop.precios.alquiler.comision && (
                                                                    <p className="text-[10px] text-slate-500">Comisión: {prop.precios.alquiler.comision}%</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500 text-sm">—</span>
                                                        )}
                                                    </td>

                                                    {/* 🏷️ Estado + Badge */}
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col gap-2">
                                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${estadoStyle.bg} ${estadoStyle.text} border border-transparent`}>
                                                                {estadoStyle.label}
                                                            </span>

                                                            {/* Selector rápido de estado */}
                                                            <select
                                                                value={prop.estado}
                                                                onChange={(e) => cambiarEstado(prop, e.target.value as Property['estado'])}
                                                                className="text-[10px] bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-violet-500"
                                                            >
                                                                <option value="borrador">Borrador</option>
                                                                <option value="publicado">Publicado</option>
                                                                <option value="reservado">Reservado</option>
                                                                <option value="alquilado">Alquilado</option>
                                                                <option value="vendido">Vendido</option>
                                                                <option value="baja">Baja</option>
                                                            </select>
                                                        </div>
                                                    </td>

                                                    {/* 👤 Agente */}
                                                    <td className="py-4 px-4">
                                                        <div className="text-sm">
                                                            <p className="text-white truncate max-w-[120px]">
                                                                {typeof prop.agente === 'object' ? prop.agente.name : '—'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                                                {typeof prop.agente === 'object' ? prop.agente.email : ''}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* ⚡ Acciones */}
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            {/* Ver */}
                                                            <Link
                                                                href={`/gestion/propiedades/${prop._id}`}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                                                                title="Ver detalles"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Link>

                                                            {/* Editar */}
                                                            <Link
                                                                href={`/gestion/propiedades/editar/${prop._id}`}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                                                title="Editar propiedad"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Link>

                                                            {/* Toggle destacado */}
                                                            <button
                                                                onClick={async () => {
                                                                    const res = await fetch(`/api/gestion/propiedades/${prop._id}`, {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ destacado: !prop.destacado }),
                                                                    });
                                                                    if (res.ok) {
                                                                        const updated = await res.json();
                                                                        setPropiedades(prev => prev.map(p => p._id === prop._id ? updated : p));
                                                                        toast.success(prop.destacado ? 'Quitado de destacados' : 'Agregado a destacados');
                                                                    }
                                                                }}
                                                                className={`p-2 rounded-lg transition-all ${prop.destacado
                                                                    ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                                                                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                                                    }`}
                                                                title={prop.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
                                                            >
                                                                {prop.destacado ? <CheckCircle className="w-4 h-4" /> : <FaMoneyBillWave className="w-4 h-4" />}
                                                            </button>

                                                            {/* Eliminar (soft delete) */}
                                                            <button
                                                                onClick={() => deleteProperty(prop._id)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                                title="Dar de baja"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 📄 Paginación */}
                        {!internalSearch.trim() && pagination.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 pb-8">
                                <div className="text-sm text-slate-400">
                                    Mostrando {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, pagination.total)} de {pagination.total} propiedades
                                </div>
                                <div className="flex gap-2">
                                    {currentPage > 1 && (
                                        <Link href={buildUrl(currentPage - 1)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition active:scale-[0.98]">
                                            Anterior
                                        </Link>
                                    )}
                                    <span className="px-4 py-2 text-slate-300">
                                        Página {currentPage} de {pagination.totalPages}
                                    </span>
                                    {currentPage < pagination.totalPages && (
                                        <Link href={buildUrl(currentPage + 1)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition active:scale-[0.98]">
                                            Siguiente
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 🗑️ Sección de Propiedades Eliminadas */}
                        <div className="mt-12">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setMostrarEliminadas(!mostrarEliminadas)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="font-medium">
                                        {mostrarEliminadas ? 'Ocultar' : 'Ver'} propiedades eliminadas
                                    </span>
                                    {!loadingEliminadas && mostrarEliminadas && (
                                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-rose-500/20">
                                            {propiedadesEliminadas.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {mostrarEliminadas && (
                                <div className="bg-slate-900/60 rounded-xl border border-rose-500/20 overflow-hidden backdrop-blur-sm">
                                    <div className="p-4 border-b border-rose-500/20 bg-rose-500/5">
                                        <h3 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
                                            <Trash2 className="w-5 h-5" />
                                            Propiedades Eliminadas
                                            <span className="text-sm font-normal text-slate-400">
                                                ({propiedadesEliminadas.length} {propiedadesEliminadas.length === 1 ? 'propiedad' : 'propiedades'})
                                            </span>
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Estas propiedades están ocultas del sitio público. Podés restaurarlas cuando quieras.
                                        </p>
                                    </div>

                                    {loadingEliminadas ? (
                                        <div className="p-8 text-center">
                                            <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-3" />
                                            <p className="text-slate-400 text-sm">Cargando propiedades eliminadas...</p>
                                        </div>
                                    ) : propiedadesEliminadas.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                                            <p className="text-slate-400">No hay propiedades eliminadas</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[900px]">
                                                <thead className="bg-rose-500/5 text-rose-300/80 text-xs uppercase tracking-wider">
                                                    <tr>
                                                        <th className="text-left py-3 px-4">Propiedad</th>
                                                        <th className="text-left py-3 px-4">Ubicación</th>
                                                        <th className="text-left py-3 px-4">Tipo</th>
                                                        <th className="text-left py-3 px-4">Precio</th>
                                                        <th className="text-left py-3 px-4">Fecha eliminación</th>
                                                        <th className="text-left py-3 px-4">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-rose-500/10">
                                                    {propiedadesEliminadas.map((prop) => {
                                                        const imgPrincipal = getImagenPrincipal(prop.imagenes);
                                                        return (
                                                            <tr key={prop._id} className="hover:bg-rose-500/5 transition-colors group">
                                                                {/* Propiedad + Imagen */}
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0 opacity-60">
                                                                            {imgPrincipal ? (
                                                                                <img src={imgPrincipal} alt={prop.titulo} className="w-full h-full object-cover grayscale" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                                                    <FaBuilding className="w-5 h-5" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-white font-medium truncate line-through decoration-rose-500/50">
                                                                                {prop.titulo}
                                                                            </p>
                                                                            <p className="text-xs text-slate-500 capitalize">{prop.tipoPropiedad}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Ubicación */}
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                                                        <FaMapMarkerAlt className="w-3.5 h-3.5 text-rose-400/60 flex-shrink-0" />
                                                                        <span className="truncate">{getDireccionCorta(prop.direccion)}</span>
                                                                    </div>
                                                                </td>

                                                                {/* Tipo */}
                                                                <td className="py-3 px-4">
                                                                    <span className="text-xs px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                                        {prop.tipoOperacion}
                                                                    </span>
                                                                </td>

                                                                {/* Precio */}
                                                                <td className="py-3 px-4">
                                                                    {prop.precios.venta?.monto ? (
                                                                        <p className="text-slate-400 text-sm">
                                                                            {formatPrice(prop.precios.venta.monto, prop.precios.venta.moneda)}
                                                                        </p>
                                                                    ) : prop.precios.alquiler?.monto ? (
                                                                        <p className="text-slate-400 text-sm">
                                                                            {formatPrice(prop.precios.alquiler.monto, prop.precios.alquiler.moneda)}/mes
                                                                        </p>
                                                                    ) : (
                                                                        <span className="text-slate-600 text-sm">—</span>
                                                                    )}
                                                                </td>

                                                                {/* Fecha de eliminación */}
                                                                <td className="py-3 px-4">
                                                                    <p className="text-xs text-slate-500">
                                                                        {new Date(prop.updatedAt).toLocaleDateString('es-AR', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric',
                                                                        })}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-600">
                                                                        {new Date(prop.updatedAt).toLocaleTimeString('es-AR', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                    </p>
                                                                </td>

                                                                {/* Acciones */}
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-1.5">
                                                                        {/* Ver detalles
                                                                        <Link
                                                                            href={`/gestion/propiedades/${prop._id}`}
                                                                            className="p-2 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                                                                            title="Ver detalles"
                                                                        >
                                                                            <Eye className="w-4 h-4" />
                                                                        </Link> */}

                                                                        {/* Restaurar */}
                                                                        <button
                                                                            onClick={() => restaurarPropiedad(prop)}
                                                                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                                                            title="Restaurar propiedad"
                                                                        >
                                                                            <RotateCcw className="w-4 h-4" />
                                                                        </button>

                                                                        {/* Editar 
                                                                        <Link
                                                                            href={`/gestion/propiedades/editar/${prop._id}`}
                                                                            className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                                                            title="Editar propiedad"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </Link>*/}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}