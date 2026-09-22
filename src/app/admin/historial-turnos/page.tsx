'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHistory, faSearch, faSpinner, faFilter,
    faCalendarCheck, faCalendarTimes, faClock,
    faUserMd, faUserInjured, faChartLine,
    faFilePrescription, faNotesMedical, faDownload,
    faTimes, faCheckCircle, faBan, faHourglassHalf,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { FaArrowLeft } from 'react-icons/fa';

export default function HistorialTurnosPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [turnos, setTurnos] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profesionales, setProfesionales] = useState<any[]>([]);

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroProfesional, setFiltroProfesional] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin/historial-turnos');
            return;
        }
        if (status === 'authenticated') {
            fetchProfesionales();
            fetchHistorial();
        }
    }, [status, router]);

    // Recargar cuando cambian los filtros
    useEffect(() => {
        if (status === 'authenticated') fetchHistorial();
    }, [filtroProfesional, filtroEstado, fechaDesde, fechaHasta]);

    const fetchProfesionales = async () => {
        try {
            const res = await fetch('/api/admin/profesionales');
            const data = await res.json();
            if (data.success) setProfesionales(data.profesionales);
        } catch (error) {
            console.error('Error cargando profesionales:', error);
        }
    };

    const fetchHistorial = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (busqueda) params.append('busqueda', busqueda);
            if (filtroProfesional) params.append('profesionalId', filtroProfesional);
            if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
            if (fechaDesde) params.append('fechaDesde', fechaDesde);
            if (fechaHasta) params.append('fechaHasta', fechaHasta);

            const res = await fetch(`/api/historial-turnos?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setTurnos(data.turnos);
                setStats(data.stats);
            }
        } catch (error) {
            toast.error('Error al cargar el historial');
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = (e: React.FormEvent) => {
        e.preventDefault();
        fetchHistorial();
    };

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroProfesional('');
        setFiltroEstado('todos');
        setFechaDesde('');
        setFechaHasta('');
    };

    // Función para exportar a CSV
    const exportarCSV = () => {
        const headers = ['Fecha', 'Hora', 'Paciente', 'Profesional', 'Estado', 'Motivo'];
        const rows = turnos.map(t => [
            new Date(t.fechaInicio).toLocaleDateString('es-AR'),
            new Date(t.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            `${t.paciente?.name} ${t.paciente?.lastName}`,
            `${t.profesional?.name} ${t.profesional?.lastName}`,
            t.estado,
            t.motivoConsulta || ''
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial-turnos-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('✅ Archivo CSV descargado');
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'completado': return { icon: faCheckCircle, color: 'text-slate-400', bg: 'bg-slate-500/20' };
            case 'confirmado': return { icon: faCheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
            case 'pendiente': return { icon: faHourglassHalf, color: 'text-amber-400', bg: 'bg-amber-500/20' };
            case 'cancelado': return { icon: faBan, color: 'text-red-400', bg: 'bg-red-500/20' };
            case 'ausente': return { icon: faTimes, color: 'text-rose-400', bg: 'bg-rose-500/20' };
            default: return { icon: faClock, color: 'text-slate-400', bg: 'bg-slate-500/20' };
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
            <div className="max-w-7xl mt-40 mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">

                    {/* volver */}

                    <button
                        onClick={() => router.push('/gestion')}
                        className="inline-flex  items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-8 group w-fit"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        Volver al Panel Principal
                    </button>

                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <FontAwesomeIcon icon={faHistory} className="text-sky-500" />
                            Historial de Turnos
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Consulta, filtra y exporta el historial completo de turnos.</p>
                    </div>
                    <button
                        onClick={exportarCSV}
                        disabled={turnos.length === 0}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faDownload} /> Exportar CSV
                    </button>
                </div>

                {/* ✅ TARJETAS DE ESTADÍSTICAS */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Completados</p>
                            <p className="text-2xl font-bold text-slate-300">{stats.completados}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Confirmados</p>
                            <p className="text-2xl font-bold text-emerald-400">{stats.confirmados}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Pendientes</p>
                            <p className="text-2xl font-bold text-amber-400">{stats.pendientes}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Cancelados/Ausentes</p>
                            <p className="text-2xl font-bold text-red-400">{stats.cancelados + stats.ausentes}</p>
                        </div>
                    </div>
                )}

                {/* ✅ PANEL DE FILTROS */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} /> Filtros de Búsqueda
                        </h3>
                        <button
                            onClick={limpiarFiltros}
                            className="text-xs text-slate-400 hover:text-sky-400 transition flex items-center gap-1"
                        >
                            <FontAwesomeIcon icon={faTimes} className="w-3 h-3" /> Limpiar filtros
                        </button>
                    </div>

                    <form onSubmit={handleBuscar} className="space-y-4">
                        {/* Fila 1: Búsqueda */}
                        <div className="relative">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por nombre, apellido, email o teléfono del paciente..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                            />
                        </div>

                        {/* Fila 2: Filtros avanzados */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Profesional</label>
                                <select
                                    value={filtroProfesional}
                                    onChange={(e) => setFiltroProfesional(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none"
                                >
                                    <option value="">Todos los profesionales</option>
                                    {profesionales.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} {p.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Estado</label>
                                <select
                                    value={filtroEstado}
                                    onChange={(e) => setFiltroEstado(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none"
                                >
                                    <option value="todos">Todos</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="completado">Completado</option>
                                    <option value="cancelado">Cancelado</option>
                                    <option value="ausente">Ausente</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Desde</label>
                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Hasta</label>
                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full md:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                        >
                            <FontAwesomeIcon icon={faSearch} /> Aplicar Búsqueda
                        </button>
                    </form>
                </div>

                {/* ✅ TABLA DE TURNOS */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Fecha y Hora</th>
                                    <th className="px-4 py-3">Paciente</th>
                                    <th className="px-4 py-3">Profesional</th>
                                    <th className="px-4 py-3">Motivo</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {turnos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                            No se encontraron turnos con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : (
                                    turnos.map((turno: any) => {
                                        const estadoInfo = getEstadoIcon(turno.estado);
                                        return (
                                            <tr key={turno._id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-white">
                                                        {new Date(turno.fechaInicio).toLocaleDateString('es-AR')}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(turno.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-white">{turno.paciente?.name} {turno.paciente?.lastName}</p>
                                                    <p className="text-xs text-slate-500">{turno.paciente?.email}</p>
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">
                                                    {turno.profesional?.name} {turno.profesional?.lastName}
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                                                    {turno.motivoConsulta || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.bg} ${estadoInfo.color}`}>
                                                        <FontAwesomeIcon icon={estadoInfo.icon} className="w-3 h-3" />
                                                        {turno.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {turno.paciente?._id && (
                                                            <>
                                                                <button
                                                                    onClick={() => window.open(`/admin/evolucion/${turno.paciente._id}`, '_blank')}
                                                                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition"
                                                                    title="Ver evolución"
                                                                >
                                                                    <FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => window.open(`/admin/prescripciones?paciente=${turno.paciente._id}`, '_blank')}
                                                                    className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded transition"
                                                                    title="Ver prescripciones"
                                                                >
                                                                    <FontAwesomeIcon icon={faFilePrescription} className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info de resultados */}
                <p className="text-xs text-slate-500 mt-4 text-center">
                    Mostrando {turnos.length} turno{turnos.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
}