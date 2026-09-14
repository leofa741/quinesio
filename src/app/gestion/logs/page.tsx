// src/app/gestion/logs/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from "@/app/lib/mongoose";
import LogModel from "@/app/models/LogLogin";
import FilterForm from './app/gestion/logins/components/FilterForm';


export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

// 🎨 Sistema de diseño premium consistente
const theme = {
    bg: 'bg-slate-950',
    bgCard: 'bg-slate-900/80',
    bgCardHover: 'bg-slate-800/90',
    border: 'border-slate-700/50',
    borderHover: 'border-purple-500/40',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-400',
    textAccent: 'text-purple-400',
    gradient: 'from-purple-600/20 via-violet-600/20 to-indigo-600/20',
    gradientBorder: 'from-purple-500 via-violet-500 to-indigo-500',
    shadow: 'shadow-2xl shadow-purple-900/20',
    shadowHover: 'shadow-purple-900/40',
};

export default async function LoginsPage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string; provider?: string; page?: string }>;
}) {
    // ===============================
    // 🔒 VALIDACIÓN DE SESIÓN Y ROL
    // ===============================
    const session = await getServerSession(authOptions);

    if (!session) redirect('/login');

    const allowedRoles = ['superadmin', 'admin'];
    if (!allowedRoles.includes(session.user.role)) {
        redirect('/gestion');
    }

    // ===============================
    // ✅ LÓGICA DE DATOS
    // ===============================
    await connectDB();
    const params = await searchParams;

    const emailFilter = params.email || "";
    const providerFilter = params.provider || "";
    const currentPage = Math.max(1, parseInt(params.page || "1", 10));

    const query: any = {};
    if (emailFilter) query.email = { $regex: emailFilter, $options: "i" };
    if (providerFilter) query.provider = providerFilter;

    const totalLogs = await LogModel.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

    const logs = await LogModel.find(query)
        .sort({ timestamp: -1 })
        .limit(PAGE_SIZE)
        .skip((currentPage - 1) * PAGE_SIZE);

    const getProviderLabel = (provider: string) => {
        const labels: Record<string, string> = {
            google: "Google",
            credentials: "Email/Contraseña",
            github: "GitHub",
        };
        return labels[provider] || provider;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString("es-AR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
    };

    const buildUrl = (page: number) => {
        const params = new URLSearchParams();
        if (emailFilter) params.set("email", emailFilter);
        if (providerFilter) params.set("provider", providerFilter);
        params.set("page", page.toString());
        return `/gestion/logs?${params.toString()}`;
    };

    const userName = session.user.name || 'Administrador';

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative overflow-hidden`}>

            {/* ✨ Background decorativo sutil */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-30`} />
                <div className={`absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl opacity-20`} />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
            </div>

            {/* 🚨 ESPACIO PARA NAVBAR FIJO - Solución al solapamiento */}
            <div className="pt-24 lg:pt-28" />

            <div className="relative z-10 px-4 md:px-8 pb-12">

                {/* 🏷️ Header Premium */}
                <header className="mb-10 max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 mb-4">
                                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-[10px] tracking-[0.25em] uppercase text-slate-400">Auditoría de Seguridad</span>
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                                    Bitácora de Accesos
                                </span>
                            </h1>
                            
                            <p className={`${theme.textSecondary} text-base font-light`}>
                                Registros de inicio de sesión • Administrado por <span className={`${theme.textAccent} font-medium`}>{userName}</span>
                            </p>
                        </div>

                        {/* 📊 Resumen rápido */}
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-right">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Total registros</p>
                                <p className="text-xl font-bold text-white">{totalLogs.toLocaleString('es-AR')}</p>
                            </div>
                            <div className="px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-right">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Página</p>
                                <p className="text-xl font-bold text-white">{currentPage}<span className="text-slate-500 text-sm">/{totalPages}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* 🔗 Breadcrumb elegante */}
                    <nav className="mt-6 flex items-center text-sm">
                        <a href="/gestion" className={`${theme.textSecondary} hover:${theme.textAccent} transition-colors flex items-center gap-1.5`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Gestión
                        </a>
                        <span className={`${theme.textSecondary} mx-2`}>/</span>
                        <span className="text-white font-medium">Bitácora</span>
                    </nav>
                </header>

                {/* 🔍 Filtros - Card Premium */}
                <section className={`mb-8 ${theme.bgCard} ${theme.border} rounded-2xl p-5 backdrop-blur-sm`}>
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Filtros de Búsqueda</h2>
                    </div>
                    <div className={`${theme.textSecondary} text-sm`}>
                        <FilterForm />
                    </div>
                </section>

                {/* 📋 Tabla de Logs - Diseño Premium */}
                {logs.length === 0 ? (
                    <div className={`text-center py-16 ${theme.bgCard} ${theme.border} rounded-2xl backdrop-blur-sm`}>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-4">
                            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className={`${theme.textSecondary} text-lg`}>No se encontraron registros</p>
                        <p className="text-slate-500 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                ) : (
                    <div className={`${theme.bgCard} ${theme.border} rounded-2xl overflow-hidden backdrop-blur-sm ${theme.shadow}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className={`${theme.textSecondary} text-xs uppercase tracking-wider border-b ${theme.border}`}>
                                        <th className="text-left py-4 px-6 font-medium">Email</th>
                                        <th className="text-left py-4 px-6 font-medium">Método</th>
                                        <th className="text-left py-4 px-6 font-medium">Fecha y Hora</th>
                                        <th className="text-right py-4 px-6 font-medium">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {logs.map((log: any, index: number) => (
                                        <tr 
                                            key={log._id} 
                                            className={`group transition-all duration-200 hover:${theme.bgCardHover} ${index % 2 === 0 ? 'bg-slate-900/30' : ''}`}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-medium text-purple-400">
                                                            {log.email?.charAt(0).toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-white font-medium break-all">{log.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`
                                                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                                                    bg-gradient-to-r from-amber-500/10 to-orange-500/10 
                                                    text-amber-400 border border-amber-500/20
                                                    group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-all
                                                `}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                    {getProviderLabel(log.provider)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm text-slate-300">
                                                    <p className="font-medium">{formatDate(log.timestamp).split(',')[0]}</p>
                                                    <p className="text-slate-500 text-xs">{formatDate(log.timestamp).split(',')[1].trim()}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button 
                                                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white"
                                                    title="Ver detalles"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 📄 Paginación Premium */}
                {totalLogs > PAGE_SIZE && (
                    <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className={`${theme.textSecondary} text-sm`}>
                            Mostrando <span className="text-white font-medium">{((currentPage - 1) * PAGE_SIZE) + 1}</span> -{" "}
                            <span className="text-white font-medium">{Math.min(currentPage * PAGE_SIZE, totalLogs)}</span> de{" "}
                            <span className="text-white font-medium">{totalLogs}</span> registros
                        </span>
                        
                        <div className="flex items-center gap-2">
                            {currentPage > 1 ? (
                                <a
                                    href={buildUrl(currentPage - 1)}
                                    className={`
                                        group flex items-center gap-1.5 px-4 py-2 rounded-xl
                                        bg-slate-800/60 border border-slate-700/50 text-sm text-white
                                        hover:bg-slate-700/60 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-900/20
                                        transition-all duration-300
                                    `}
                                >
                                    <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Anterior
                                </a>
                            ) : (
                                <span className="px-4 py-2 rounded-xl bg-slate-800/30 border border-slate-700/30 text-sm text-slate-500 cursor-not-allowed">
                                    Anterior
                                </span>
                            )}

                            {/* Números de página */}
                            <div className="hidden sm:flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <a
                                            key={pageNum}
                                            href={buildUrl(pageNum)}
                                            className={`
                                                w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                                ${currentPage === pageNum 
                                                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-900/40' 
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                }
                                            `}
                                        >
                                            {pageNum}
                                        </a>
                                    );
                                })}
                            </div>

                            {currentPage < totalPages ? (
                                <a
                                    href={buildUrl(currentPage + 1)}
                                    className={`
                                        group flex items-center gap-1.5 px-4 py-2 rounded-xl
                                        bg-slate-800/60 border border-slate-700/50 text-sm text-white
                                        hover:bg-slate-700/60 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-900/20
                                        transition-all duration-300
                                    `}
                                >
                                    Siguiente
                                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            ) : (
                                <span className="px-4 py-2 rounded-xl bg-slate-800/30 border border-slate-700/30 text-sm text-slate-500 cursor-not-allowed">
                                    Siguiente
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* 📌 Footer informativo */}
                <footer className="mt-12 text-center">
                    <p className={`${theme.textSecondary} text-[10px] tracking-[0.25em] uppercase`}>
                        Bitácora de Seguridad • Logs en tiempo real • Última actualización: {new Date().toLocaleTimeString('es-AR')}
                    </p>
                </footer>
            </div>
        </div>
    );
}