'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faChartLine, faUserInjured, faUserMd,
    faCalendarAlt, faArrowTrendDown, faArrowTrendUp,
    faCheckCircle, faSpinner, faBullseye
} from '@fortawesome/free-solid-svg-icons';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

export default function EvolucionPacientePage() {
    const params = useParams();
    const router = useRouter();
    const pacienteId = params?.pacienteId as string;

    const [sesiones, setSesiones] = useState<any[]>([]);
    const [paciente, setPaciente] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (pacienteId) fetchEvolucion();
    }, [pacienteId]);

    const fetchEvolucion = async () => {
        setLoading(true);
        try {
            // Buscamos las sesiones del paciente
            const res = await fetch(`/api/plantillas/sesiones?pacienteId=${pacienteId}`);
            const data = await res.json();

            if (data.success && data.sesiones?.length > 0) {
                // Ordenar por fecha cronológicamente
                const sesionesOrdenadas = data.sesiones.sort(
                    (a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
                );
                setSesiones(sesionesOrdenadas);

                // Obtener datos del paciente (del primer registro)
                if (sesionesOrdenadas[0]?.paciente) {
                    setPaciente(sesionesOrdenadas[0].paciente);
                }
            }
        } catch (error) {
            console.error('Error cargando evolución:', error);
        } finally {
            setLoading(false);
        }
    };

    // Preparar datos para el gráfico
    const chartData = sesiones.map((s: any, index: number) => ({
        sesion: `Sesión ${index + 1}`,
        fecha: new Date(s.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        dolor: s.dolorEva || 0,
        fechaCompleta: new Date(s.fecha).toLocaleDateString('es-AR')
    }));

    // Calcular métricas
    const calcularMetricas = () => {
        if (sesiones.length < 2) return null;

        const primerDolor = sesiones[0]?.dolorEva || 0;
        const ultimoDolor = sesiones[sesiones.length - 1]?.dolorEva || 0;
        const mejora = primerDolor - ultimoDolor;
        const porcentajeMejora = primerDolor > 0 ? ((mejora / primerDolor) * 100).toFixed(1) : '0';
        const promedioDolor = (sesiones.reduce((acc, s) => acc + (s.dolorEva || 0), 0) / sesiones.length).toFixed(1);

        return {
            sesionesTotales: sesiones.length,
            primerDolor,
            ultimoDolor,
            mejora,
            porcentajeMejora,
            promedioDolor,
            diasTratamiento: Math.ceil(
                (new Date(sesiones[sesiones.length - 1].fecha).getTime() -
                    new Date(sesiones[0].fecha).getTime()) / (1000 * 60 * 60 * 24)
            )
        };
    };

    const metricas = calcularMetricas();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-6xl mt-40 mx-auto">

                {/* Botón Volver - Usamos push en lugar de back porque la página se abre en nueva pestaña */}
                <button
                    onClick={() => router.push('/admin/turnos')}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-6 transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} /> Volver a la Agenda
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2">
                        <FontAwesomeIcon icon={faChartLine} className="text-sky-500" />
                        Evolución del Paciente
                    </h1>
                    {paciente && (
                        <div className="flex items-center gap-3 text-slate-400">
                            <FontAwesomeIcon icon={faUserInjured} className="text-sky-400" />
                            <span className="text-lg font-semibold text-white">
                                {paciente.name} {paciente.lastName}
                            </span>
                        </div>
                    )}
                </div>

                {sesiones.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                        <FontAwesomeIcon icon={faChartLine} className="w-16 h-16 text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Sin datos de evolución</h3>
                        <p className="text-slate-400 mb-6">
                            Este paciente aún no tiene sesiones clínicas registradas con nivel de dolor (EVA).
                        </p>
                        <button
                            onClick={() => router.push('/admin/turnos')}
                            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition"
                        >
                            Ir a la agenda
                        </button>
                    </div>
                ) : (
                    <>
                        {/* TARJETAS DE MÉTRICAS */}
                        {metricas && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                {/* Sesiones realizadas */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Sesiones</p>
                                    <p className="text-3xl font-bold text-white">{metricas.sesionesTotales}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        en {metricas.diasTratamiento} días
                                    </p>
                                </div>

                                {/* Dolor inicial vs final */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Progreso del Dolor</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-amber-400">{metricas.primerDolor}</span>
                                        <FontAwesomeIcon icon={faArrowTrendDown} className="text-slate-500" />
                                        <span className="text-2xl font-bold text-emerald-400">{metricas.ultimoDolor}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        EVA (0-10)
                                    </p>
                                </div>

                                {/* Porcentaje de mejora */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Mejora Total</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-3xl font-bold ${metricas.mejora > 0 ? 'text-emerald-400' :
                                                metricas.mejora < 0 ? 'text-red-400' : 'text-slate-400'
                                            }`}>
                                            {metricas.mejora > 0 ? '-' : ''}{Math.abs(metricas.mejora)}
                                        </span>
                                        <span className="text-lg text-slate-500">pts</span>
                                    </div>
                                    <p className={`text-xs mt-1 font-semibold ${metricas.mejora > 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {metricas.porcentajeMejora}% de mejora
                                    </p>
                                </div>

                                {/* Promedio de dolor */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Dolor Promedio</p>
                                    <p className="text-3xl font-bold text-sky-400">{metricas.promedioDolor}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        EVA promedio
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* GRÁFICO PRINCIPAL */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FontAwesomeIcon icon={faChartLine} className="text-sky-500" />
                                    Evolución del Dolor (EVA)
                                </h2>
                                <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                                    Escala 0-10
                                </span>
                            </div>

                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorDolor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis
                                            dataKey="fecha"
                                            stroke="#64748b"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            domain={[0, 10]}
                                            style={{ fontSize: '12px' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                                color: '#f1f5f9'
                                            }}
                                            labelStyle={{ color: '#94a3b8' }}
                                            formatter={(value: any) => [`EVA: ${value}`, 'Nivel de dolor']}
                                            labelFormatter={(label: any) => `Fecha: ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="dolor"
                                            stroke="#0ea5e9"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorDolor)"
                                            dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 6 }}
                                            activeDot={{ r: 8, fill: '#0ea5e9' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {metricas && metricas.mejora > 0 && (
                                <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-emerald-300 font-semibold">Tratamiento exitoso</p>
                                        <p className="text-emerald-200 text-sm mt-1">
                                            El paciente ha reducido su dolor en un <strong>{metricas.porcentajeMejora}%</strong> en {metricas.sesionesTotales} sesiones.
                                            El tratamiento está logrando los objetivos planteados.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* HISTORIAL DE SESIONES */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sky-500" />
                                    Historial de Sesiones
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {sesiones.map((s: any, index: number) => (
                                    <div key={s._id} className="p-5 hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        Sesión {index + 1}
                                                    </span>
                                                    <span className="text-sm text-slate-400">
                                                        {new Date(s.fecha).toLocaleDateString('es-AR', {
                                                            day: '2-digit', month: 'long', year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                {s.tecnicasAplicadas && (
                                                    <p className="text-slate-300 text-sm mb-1">
                                                        <strong className="text-slate-400">Técnicas:</strong> {s.tecnicasAplicadas}
                                                    </p>
                                                )}
                                                {s.evolucion && (
                                                    <p className="text-slate-400 text-sm">
                                                        <strong className="text-slate-500">Evolución:</strong> {s.evolucion}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 text-center">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dolor</p>
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${s.dolorEva <= 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        s.dolorEva <= 6 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                            'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {s.dolorEva || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
