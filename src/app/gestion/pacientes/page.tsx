// app/gestion/pacientes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Swal from 'sweetalert2';
import {
    FaEdit, FaTrash, FaUserInjured, FaArrowLeft, FaSearch,
    FaChevronLeft, FaChevronRight, FaBan
} from 'react-icons/fa';

interface Paciente {
    _id: string;
    name: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    img?: string;
    role: string;
    activo?: boolean;
    createdAt?: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

// 🔹 Configuración personalizada de SweetAlert2 para tema oscuro
const swalDark = Swal.mixin({
    customClass: {
        popup: 'bg-slate-900 border border-slate-700 text-white',
        title: 'text-white',
        htmlContainer: 'text-slate-300',
        confirmButton: 'bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg',
        cancelButton: 'bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg',
        input: 'bg-slate-800 border-slate-600 text-white rounded-lg',
        validationMessage: 'text-rose-400'
    },
    buttonsStyling: false
});

export default function PacientesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 });
    const [isAuthorized, setIsAuthorized] = useState(false);

    // 🔹 Filtros y búsqueda
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [obraSocial, setObraSocial] = useState(searchParams.get('obraSocial') || '');
    const [ciudad, setCiudad] = useState(searchParams.get('ciudad') || '');
    const [activo, setActivo] = useState<boolean | null>(null);

    // 🔹 Validar acceso
    useEffect(() => {
        const validate = async () => {
            if (status === 'loading') return;
            if (status === 'unauthenticated') {
                router.push('/login?callbackUrl=/gestion/pacientes');
                return;
            }

            const token = session?.user?.token;
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const allowedRoles = ['admin', 'profesionales', 'administrativos'];

                if (!allowedRoles.includes(payload.role)) {
                    router.push(payload.role === 'pacientes' ? '/turnos' : '/');
                    return;
                }
                setIsAuthorized(true);
            } catch {
                router.push('/login');
            }
        };
        validate();
    }, [status, session, router]);

    // 🔹 Cargar pacientes con filtros y paginación
    const fetchPacientes = useCallback(async () => {
        if (!isAuthorized) return;

        try {
            const token = session?.user?.token;

            const paramsObj: Record<string, string> = {
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            };
            if (search) paramsObj.search = search;
            if (obraSocial) paramsObj.obraSocial = obraSocial;
            if (ciudad) paramsObj.ciudad = ciudad;
            if (activo !== null) paramsObj.activo = activo.toString();

            const params = new URLSearchParams(paramsObj);
            console.log('🔍 [FETCH] Query params:', params.toString());

            const res = await fetch(`/api/pacientes?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 [FETCH] Status:', res.status);

            if (res.status === 403) {
                router.push('/gestion');
                return;
            }

            if (!res.ok) throw new Error(`Error ${res.status}`);

            const data = await res.json();
            console.log('📦 [FETCH] Data:', {
                total: data.pagination?.total,
                count: data.pacientes?.length,
                first: data.pacientes?.[0]
            });

            setPacientes(data.pacientes || []);
            setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });

        } catch (err) {
            console.error('❌ Error cargando pacientes:', err);
            swalDark.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los pacientes. Intente nuevamente.'
            });
        } finally {
            setLoading(false);
        }
    }, [pagination.page, search, obraSocial, ciudad, activo, session, router, isAuthorized]);

    // 🔹 Efecto para recargar cuando cambian filtros
    useEffect(() => {
        if (isAuthorized) {
            fetchPacientes();
        }
    }, [fetchPacientes, isAuthorized]);

    // 🔹 Handlers
    const handleSearch = (value: string) => {
        setSearch(value);
        setPagination(p => ({ ...p, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination(p => ({ ...p, page: newPage }));
    };

    const handleClearFilters = () => {
        setSearch('');
        setObraSocial('');
        setCiudad('');
        setActivo(null);
        setPagination(p => ({ ...p, page: 1 }));
    };

    const handleEditar = (id: string) => {
        router.push(`/gestion/pacientes/${id}/editar`);
    };

    const handleEliminar = async (id: string) => {
        const result = await swalDark.fire({
            title: '¿Desactivar paciente?',
            text: 'No se elimina, solo se oculta de la lista. Podrás reactivarlo luego.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            const token = session?.user?.token;
            const res = await fetch(`/api/pacientes?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setPacientes(pacientes.map(p =>
                    p._id === id ? { ...p, activo: false } : p
                ));

                swalDark.fire({
                    icon: 'success',
                    title: 'Paciente desactivado',
                    text: 'El paciente ha sido desactivado exitosamente.',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err) {
            console.error('Error eliminando:', err);
            swalDark.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo desactivar el paciente. Intente nuevamente.'
            });
        }
    };

    // 🔹 Loader
    if (status === 'loading' || loading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Cargando pacientes...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">

            {/* Header */}
            <div className="max-w-6xl mx-auto mt-32 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/gestion')}
                            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <FaArrowLeft className="text-slate-400 hover:text-white" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Gestión de Pacientes</h1>
                            <p className="text-slate-400 text-sm">
                                {pagination.total} registrados • Página {pagination.page} de {pagination.pages}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/gestion/pacientes/nuevo')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg font-medium transition-colors"
                    >
                        + Nuevo Paciente
                    </button>

                </div>
            </div>

            {/* 🔹 Barra de Búsqueda y Filtros */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">

                    {/* Fila 1: Búsqueda + Filtros */}
                    <div className="flex flex-col sm:flex-row gap-4">

                        {/* Búsqueda principal */}
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, apellido o email..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        {/* Filtro Obra Social */}
                        <input
                            type="text"
                            placeholder="Obra Social..."
                            value={obraSocial}
                            onChange={(e) => { setObraSocial(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full sm:w-48 transition-colors"
                        />

                        {/* Filtro Ciudad */}
                        <input
                            type="text"
                            placeholder="Ciudad..."
                            value={ciudad}
                            onChange={(e) => { setCiudad(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full sm:w-48 transition-colors"
                        />

                        {/* Toggle Activo */}
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={activo === true}
                                onChange={(e) => {
                                    setActivo(e.target.checked ? true : false);
                                    setPagination(p => ({ ...p, page: 1 }));
                                }}
                                className="rounded border-slate-600 text-sky-500 focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-300">
                                {activo === null ? 'Todos' : activo ? 'Activos' : 'Inactivos'}
                            </span>
                        </label>
                    </div>

                    {/* Fila 2: Botones de acción de filtros */}
                    {(search || obraSocial || ciudad || activo !== null) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                            <span className="text-xs text-slate-500">Filtros activos:</span>
                            {search && <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-xs">Búsqueda: "{search}"</span>}
                            {obraSocial && <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-xs">Obra Social: "{obraSocial}"</span>}
                            {ciudad && <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-xs">Ciudad: "{ciudad}"</span>}
                            {activo === true && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">Activos</span>}
                            {activo === false && <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-400 text-xs">Inactivos</span>}
                            <button
                                onClick={handleClearFilters}
                                className="ml-auto text-xs text-sky-400 hover:text-sky-300 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 🔹 Tabla de Pacientes */}
            <div className="max-w-6xl mx-auto">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Paciente</th>
                                    <th className="px-6 py-4">Ciudad</th>
                                    <th className="px-6 py-4">Teléfono</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {pacientes.map((pac) => (
                                    <tr 
                                        key={pac._id} 
                                        className={`hover:bg-slate-800/30 transition-colors ${pac.activo === false ? 'opacity-70' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                    {pac.img ? (
                                                        <Image src={pac.img} alt={pac.name} width={40} height={40} className="object-cover" />
                                                    ) : (
                                                        <FaUserInjured className="w-full h-full p-2 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-white">{pac.lastName}, {pac.name}</p>
                                                        {/* 🔹 LABEL para pacientes desactivados */}
                                                        {pac.activo === false && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30">
                                                                <FaBan className="w-3 h-3" />
                                                                Inactivo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{pac.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{pac.city || '—'}</td>
                                        <td className="px-6 py-4 text-slate-300">{pac.phone || '—'}</td>
                                        <td className="px-6 py-4">
                                            <a href={`mailto:${pac.email}`} className="text-sky-400 hover:text-sky-300 transition-colors">
                                                {pac.email}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditar(pac._id)}
                                                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-800">
                        {pacientes.map((pac) => (
                            <div 
                                key={pac._id} 
                                className={`p-4 flex items-start gap-4 ${pac.activo === false ? 'opacity-70' : ''}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                    {pac.img ? (
                                        <Image src={pac.img} alt={pac.name} width={48} height={48} className="object-cover" />
                                    ) : (
                                        <FaUserInjured className="w-full h-full p-2 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-white truncate">{pac.lastName}, {pac.name}</p>
                                        {/* 🔹 LABEL para pacientes desactivados (Mobile) */}
                                        {pac.activo === false && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30">
                                                <FaBan className="w-3 h-3" />
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 truncate">{pac.email}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {pac.city || '—'} • {pac.phone || '—'}
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleEditar(pac._id)}
                                            className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Estado vacío */}
                    {pacientes.length === 0 && !loading && (
                        <div className="p-12 text-center text-slate-500">
                            <FaUserInjured className="mx-auto text-4xl mb-3 opacity-50" />
                            <p>No se encontraron pacientes</p>
                            {(search || obraSocial || ciudad || activo !== null) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="mt-2 text-sky-400 hover:text-sky-300 text-sm"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 🔹 Paginación */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
                        <p>
                            Página {pagination.page} de {pagination.pages} • {pagination.total} pacientes
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors flex items-center gap-1"
                            >
                                <FaChevronLeft className="w-3 h-3" /> Anterior
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors flex items-center gap-1"
                            >
                                Siguiente <FaChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}