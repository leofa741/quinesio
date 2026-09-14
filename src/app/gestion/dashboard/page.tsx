// app/app/gestion/cuentas-corrientes/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAdminAuthorization } from '@/app/hooks/useAdminAuthorization';
import {
  FaUserFriends,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaWhatsapp,
  FaEnvelope,
  FaSearch,
  FaArrowLeft,
  FaCheckCircle,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaEye,
  FaDownload
} from 'react-icons/fa';
import Link from 'next/link';

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

// 🏦 Tipos
interface CuentaCorriente {
  clienteId: string;
  razonSocial: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  formaPago: string;
  deudaTotal: number;
  pedidosDeudores: number;
  notas: string;
  tieneAlerta: boolean;
  alertaRevisada: boolean;
}

interface Resumen {
  totalAdeudado: number;
  cantidadClientes: number;
}

const FORMA_PAGO_LABEL: Record<string, string> = {
  cuenta_corriente: 'Cta. Corriente',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  qr: 'QR/MercadoPago',
  tarjeta: 'Tarjeta',
  otro: 'Otro'
};

const getDebtSeverity = (amount: number) => {
  if (amount > 500000) return { level: 'critical', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  if (amount > 200000) return { level: 'high', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
  if (amount > 50000) return { level: 'medium', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
  return { level: 'low', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
};

export default function CuentasCorrientesPage() {
  const isAuthorized = useAdminAuthorization();
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<Resumen>({ totalAdeudado: 0, cantidadClientes: 0 });
  const [alertasActivas, setAlertasActivas] = useState(0);
  const [cuentas, setCuentas] = useState<CuentaCorriente[]>([]);
  const [filtro, setFiltro] = useState({ search: '', minDeuda: 0, maxDeuda: Infinity, sortBy: 'deudaTotal', sortOrder: 'desc' });
  const [mounted, setMounted] = useState(false);

  // Agrega estado y lógica similar a la página de logs que rediseñamos:
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 15;


  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isAuthorized || !mounted) return;
    const fetchCuentas = async () => {
      try {
        const res = await fetch('/api/gestion/cuentas-corrientes');
        const data = await res.json();
        setResumen({ totalAdeudado: data.totalAdeudado || 0, cantidadClientes: data.cantidadClientes || 0 });
        setAlertasActivas(data.alertasActivas || 0);
        setCuentas(data.cuentasCorrientes || []);
      } catch (err) { console.error('Error al cargar cuentas:', err); }
      finally { setLoading(false); }
    };
    fetchCuentas();
  }, [isAuthorized, mounted]);

  const cuentasFiltradas = useMemo(() => {
    let result = cuentas.filter(c => {
      const matchesSearch =
        c.razonSocial?.toLowerCase().includes(filtro.search.toLowerCase()) ||
        c.nombre?.toLowerCase().includes(filtro.search.toLowerCase()) ||
        c.apellido?.toLowerCase().includes(filtro.search.toLowerCase()) ||
        c.telefono?.includes(filtro.search);
      const matchesDeuda = c.deudaTotal >= filtro.minDeuda && c.deudaTotal <= filtro.maxDeuda;
      return matchesSearch && matchesDeuda;
    });

    result.sort((a, b) => {
      const multiplier = filtro.sortOrder === 'asc' ? 1 : -1;
      if (filtro.sortBy === 'deudaTotal') return (a.deudaTotal - b.deudaTotal) * multiplier;
      if (filtro.sortBy === 'razonSocial') return a.razonSocial.localeCompare(b.razonSocial) * multiplier;
      if (filtro.sortBy === 'pedidosDeudores') return (a.pedidosDeudores - b.pedidosDeudores) * multiplier;
      return 0;
    });

    return result;
  }, [cuentas, filtro]);

  const marcarAlertaComoRevisada = async (clienteId: string) => {
    try {
      await fetch(`/api/gestion/cuentas-corrientes/alertas/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisado: true })
      });
      setCuentas(prev => prev.map(c => c.clienteId === clienteId ? { ...c, alertaRevisada: true } : c));
      setAlertasActivas(prev => Math.max(0, prev - 1));
    } catch (err) { console.error('Error al marcar alerta:', err); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  // En el botón de exportar del header:
  const exportToCSV = () => {
    const headers = ['Cliente', 'Deuda', 'Pedidos', 'Email', 'Teléfono'];
    const rows = cuentasFiltradas.map(c => [c.razonSocial, c.deudaTotal, c.pedidosDeudores, c.email, c.telefono]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuentas-corrientes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };


  const getInitials = (nombre: string, apellido: string) =>
    `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase() || 'CL';

  const paginated = cuentasFiltradas.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);

  if (!isAuthorized || !mounted) return null;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative overflow-hidden`}>

      {/* ✨ Background decorativo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-30`} />
        <div className={`absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl opacity-20`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      </div>

      {/* 🚨 ESPACIO PARA NAVBAR FIJO */}
      <div className="pt-24 lg:pt-28" />

      <div className="relative z-10 px-4 md:px-8 pb-12">

        {/* 🏷️ Header Premium */}
        <header className="mb-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 mb-4">
                <FaMoneyBillWave className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-slate-400">Gestión Financiera</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
                  Cuentas Corrientes
                </span>
              </h1>

              <p className={`${theme.textSecondary} text-base font-light`}>
                Control de saldos pendientes y gestión de cobranzas
              </p>
            </div>

            {/* 📊 Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                // ✅ AGREGÁ ESTO:
                onClick={exportToCSV}
                className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:border-purple-500/40 transition-all" title="Exportar">
                <FaDownload className="w-4 h-4" />
              </button>


              <Link href="/gestion" className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${theme.textSecondary} hover:${theme.textAccent} transition-colors`}>
                <FaArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 📈 KPI Cards Premium */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Total Adeudado */}
          <div className={`relative ${theme.bgCard} ${theme.border} rounded-2xl p-5 backdrop-blur-sm group hover:${theme.borderHover} transition-all duration-300`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className={`${theme.textSecondary} text-sm font-medium`}>Total adeudado</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FaMoneyBillWave className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">
                {formatCurrency(resumen.totalAdeudado)}
              </p>
              <p className="text-xs text-slate-500 mt-1">En {resumen.cantidadClientes} clientes activos</p>
            </div>
          </div>

          {/* Clientes con Deuda */}
          <div className={`relative ${theme.bgCard} ${theme.border} rounded-2xl p-5 backdrop-blur-sm group hover:${theme.borderHover} transition-all duration-300`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className={`${theme.textSecondary} text-sm font-medium`}>Clientes con deuda</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <FaUserFriends className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">
                {resumen.cantidadClientes}
              </p>
              <p className="text-xs text-slate-500 mt-1">Requieren seguimiento</p>
            </div>
          </div>

          {/* Alertas Activas */}
          <div className={`relative ${theme.bgCard} ${theme.border} rounded-2xl p-5 backdrop-blur-sm group hover:${theme.borderHover} transition-all duration-300`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-rose-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className={`${theme.textSecondary} text-sm font-medium`}>Alertas activas</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <FaExclamationTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">
                {alertasActivas}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {alertasActivas > 0 ? 'Requieren atención inmediata' : 'Todo bajo control ✓'}
              </p>
            </div>
          </div>
        </section>

        {/* 🔍 Filtros Premium */}
        <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-5 mb-6 backdrop-blur-sm`}>
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Filtros y Búsqueda</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <label className={`block ${theme.textSecondary} text-xs uppercase tracking-wider mb-2`}>Buscar cliente</label>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nombre, razón social o teléfono..."
                  className={`w-full pl-11 pr-4 py-2.5 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all`}
                  value={filtro.search}
                  onChange={(e) => setFiltro(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Deuda mínima */}
            <div>
              <label className={`block ${theme.textSecondary} text-xs uppercase tracking-wider mb-2`}>Deuda mínima</label>
              <input
                type="number"
                placeholder="$0"
                className={`w-full px-4 py-2.5 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all`}
                value={filtro.minDeuda || ''}
                onChange={(e) => setFiltro(prev => ({ ...prev, minDeuda: Number(e.target.value) || 0 }))}
              />
            </div>

            {/* Ordenar por */}
            <div>
              <label className={`block ${theme.textSecondary} text-xs uppercase tracking-wider mb-2`}>Ordenar por</label>
              <select
                className={`w-full px-4 py-2.5 ${theme.bgCard} ${theme.border} rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer`}
                value={`${filtro.sortBy}-${filtro.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFiltro(prev => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <option value="deudaTotal-desc">Mayor deuda</option>
                <option value="deudaTotal-asc">Menor deuda</option>
                <option value="razonSocial-asc">Nombre A-Z</option>
                <option value="razonSocial-desc">Nombre Z-A</option>
                <option value="pedidosDeudores-desc">Más pedidos</option>
              </select>
            </div>
          </div>

          {/* Chips de filtro activo */}
          {(filtro.search || filtro.minDeuda > 0) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
              {filtro.search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">
                  Búsqueda: "{filtro.search}"
                  <button onClick={() => setFiltro(prev => ({ ...prev, search: '' }))} className="hover:text-white">×</button>
                </span>
              )}
              {filtro.minDeuda > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                  Deuda ≥ {formatCurrency(filtro.minDeuda)}
                  <button onClick={() => setFiltro(prev => ({ ...prev, minDeuda: 0 }))} className="hover:text-white">×</button>
                </span>
              )}
              <button
                onClick={() => setFiltro({ search: '', minDeuda: 0, maxDeuda: Infinity, sortBy: 'deudaTotal', sortOrder: 'desc' })}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        {/* 📋 Tabla Premium */}
        <section className={`${theme.bgCard} ${theme.border} rounded-2xl overflow-hidden backdrop-blur-sm ${theme.shadow}`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/60 mb-4 animate-pulse" />
              <p className={`${theme.textSecondary}`}>Cargando cuentas corrientes...</p>
            </div>
          ) : cuentasFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-4">
                <FaSearch className="w-8 h-8 text-slate-500" />
              </div>
              <p className={`${theme.textSecondary} text-lg`}>No se encontraron resultados</p>
              <p className="text-slate-500 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className={`${theme.textSecondary} text-xs uppercase tracking-wider border-b ${theme.border}`}>
                    <th className="text-left py-4 px-6 font-medium">Cliente</th>
                    <th className="text-left py-4 px-6 font-medium">Pago</th>
                    <th className="text-right py-4 px-6 font-medium cursor-pointer group" onClick={() => setFiltro(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}>
                      <span className="inline-flex items-center gap-1">
                        Deuda
                        {filtro.sortBy === 'deudaTotal' && (
                          filtro.sortOrder === 'asc' ? <FaSortAmountUp className="text-purple-400" /> : <FaSortAmountDown className="text-purple-400" />
                        )}
                      </span>
                    </th>
                    <th className="text-center py-4 px-6 font-medium">Pedidos</th>
                    <th className="text-left py-4 px-6 font-medium">Notas</th>
                    <th className="text-right py-4 px-6 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {cuentasFiltradas.map((cuenta) => {
                    const severity = getDebtSeverity(cuenta.deudaTotal);
                    return (
                      <tr key={cuenta.clienteId} className="group transition-all duration-200 hover:bg-slate-800/50">
                        {/* Cliente */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${severity.bg} ${severity.border} border flex items-center justify-center flex-shrink-0`}>
                              <span className={`text-sm font-semibold ${severity.color}`}>{getInitials(cuenta.nombre, cuenta.apellido)}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium truncate">{cuenta.razonSocial}</span>
                                {cuenta.tieneAlerta && !cuenta.alertaRevisada && (
                                  <span className="relative">
                                    <FaExclamationTriangle className="text-rose-400 w-4 h-4 animate-pulse" title="Alerta: deuda alta" />
                                    <span className="absolute inset-0 rounded-full bg-rose-400/20 animate-ping" />
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-400 truncate">{cuenta.nombre} {cuenta.apellido}</p>
                              <p className="text-xs text-slate-500">{cuenta.telefono}</p>
                            </div>
                          </div>
                        </td>

                        {/* Forma de pago */}
                        <td className="py-4 px-6">
                          <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
                            {FORMA_PAGO_LABEL[cuenta.formaPago] || cuenta.formaPago}
                          </span>
                        </td>

                        {/* Deuda */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-bold text-lg ${severity.color}`}>
                              {formatCurrency(cuenta.deudaTotal)}
                            </span>
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${severity.bg} ${severity.color} border ${severity.border}`}>
                              {severity.level === 'critical' ? 'Crítico' : severity.level === 'high' ? 'Alto' : severity.level === 'medium' ? 'Moderado' : 'Bajo'}
                            </span>
                          </div>
                        </td>

                        {/* Pedidos */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 text-white font-medium text-sm">
                            {cuenta.pedidosDeudores}
                          </span>
                        </td>

                        {/* Notas */}
                        <td className="py-4 px-6">
                          <span className={`text-sm ${cuenta.notas ? 'text-slate-300' : 'text-slate-500 italic'}`}>
                            {cuenta.notas || '—'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-4 px-6">
                          <div className="flex justify-end items-center gap-1.5">
                            <Link
                              href={`/gestion/clientes/${cuenta.clienteId}/finanzas`}
                              className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                              title="Ver perfil financiero"
                            >
                              <FaEye className="w-4 h-4" />
                            </Link>

                            {cuenta.telefono && (
                              <a
                                href={`https://wa.me/54${cuenta.telefono.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                title="WhatsApp"
                              >
                                <FaWhatsapp className="w-4 h-4" />
                              </a>
                            )}

                            {cuenta.email && (
                              <a
                                href={`mailto:${cuenta.email}`}
                                className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                                title="Enviar email"
                              >
                                <FaEnvelope className="w-4 h-4" />
                              </a>
                            )}

                            {cuenta.tieneAlerta && !cuenta.alertaRevisada && (
                              <button
                                onClick={() => marcarAlertaComoRevisada(cuenta.clienteId)}
                                className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                title="Marcar como revisada"
                              >
                                <FaCheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 📌 Footer informativo */}
        <footer className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className={`${theme.textSecondary} text-xs`}>
            Mostrando <span className="text-white font-medium">{cuentasFiltradas.length}</span> de <span className="text-white font-medium">{cuentas.length}</span> clientes
          </p>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Anterior
            </button>
            <span className={`${theme.textSecondary} text-xs`}>
              Página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{Math.ceil(cuentasFiltradas.length / ITEMS_PER_PAGE)}</span>
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage * ITEMS_PER_PAGE >= cuentasFiltradas.length}
              className="px-3 py-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Siguiente
            </button>
          </div>

          <p className={`${theme.textSecondary} text-[10px] tracking-[0.2em] uppercase flex items-center gap-2`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Datos en tiempo real • {new Date().toLocaleTimeString('es-AR')}
          </p>
        </footer>
      </div>
    </div>
  );
}