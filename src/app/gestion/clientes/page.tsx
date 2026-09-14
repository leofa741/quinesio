 'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { 
    FaUsers, FaPlus, FaSearch, FaEdit, FaShoppingCart, 
    FaBan, FaCheckCircle, FaBell, FaUserCircle, FaMapMarkerAlt,
    FaPhoneAlt, FaEnvelope, FaIdCard, FaCreditCard, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// 🎨 Sistema de diseño premium (consistente con el resto del panel)
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

// 🔹 Tipos (sin cambios)
interface Cliente {
  _id: string;
  razonSocial: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  formaPago: 'efectivo' | 'transferencia' | 'qr' | 'tarjeta' | 'cuenta_corriente' | 'otro';
  email?: string;
  dni?: string;
  activo: boolean;
  alerta?: {
    umbralDeuda?: number;
    revisado?: boolean;
    ultimaRevision?: string;
    notaAlerta?: string;
  };
}

// 🎨 Helpers visuales
const getInitials = (nombre: string, apellido: string) => 
    `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase() || 'CL';

const getFormaPagoStyle = (forma: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
        cuenta_corriente: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Cta. Cte.' },
        efectivo: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Efectivo' },
        transferencia: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Transferencia' },
        qr: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'QR' },
        tarjeta: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Tarjeta' },
        otro: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Otro' },
    };
    return styles[forma] || styles.otro;
};

export default function ClientesPage() {
  // ─────────────────────────────────────────────────────
  // ⚙️ LÓGICA ORIGINAL (SIN CAMBIOS - solo estética)
  // ─────────────────────────────────────────────────────
  const { status, data: session } = useSession();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 10;
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const validateAccess = async () => {
      if (status === 'loading' || !mounted) return;
      if (status === 'unauthenticated') { router.push('/'); return; }
      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) { toast.error('Acceso denegado'); router.push('/'); return; }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!['admin', 'superadmin'].includes(payload.role)) {
          toast.error('Acceso restringido a administradores');
          router.push('/');
          return;
        }
        setIsAuthorized(true);
      } catch (err) { toast.error('Sesión inválida'); router.push('/'); }
    };
    validateAccess();
  }, [status, session, router, mounted]);

  useEffect(() => {
    if (!isAuthorized) return;
    const fetchClientes = async () => {
      try {
        const res = await fetch('/api/gestion/clientes', { cache: 'no-store' });
        if (!res.ok) throw new Error('Error al cargar clientes');
        const data = await res.json();
        setClientes(data);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los clientes.', confirmButtonColor: '#d33' });
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchClientes();
  }, [isAuthorized]);

  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return clientes;
    const termino = busqueda.toLowerCase();
    return clientes.filter(cliente =>
      cliente.razonSocial.toLowerCase().includes(termino) ||
      cliente.nombre.toLowerCase().includes(termino) ||
      cliente.apellido.toLowerCase().includes(termino) ||
      (cliente.dni && cliente.dni.includes(termino)) ||
      cliente.telefono.includes(termino) ||
      (cliente.email && cliente.email.toLowerCase().includes(termino)) ||
      (cliente.formaPago && cliente.formaPago.toLowerCase().includes(termino))
    );
  }, [clientes, busqueda]);

  const totalClientes = clientesFiltrados.length;
  const totalPaginas = Math.ceil(totalClientes / clientesPorPagina);
  const clientesPaginados = clientesFiltrados.slice(
    (paginaActual - 1) * clientesPorPagina,
    paginaActual * clientesPorPagina
  );

  useEffect(() => { setPaginaActual(1); }, [busqueda]);

  useEffect(() => {
    if (!isAuthorized) return;
    const eventSource = new EventSource('/api/gestion/clientes/events');
    eventSource.onmessage = (event) => {
      if (event.data === 'ping') return;
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'nuevo_cliente': setClientes(prev => [data.data, ...prev]); break;
          case 'cliente_actualizado':
          case 'cliente_reactivado':
          case 'cliente_eliminado':
            setClientes(prev => prev.map(c => (c._id === data.data._id ? data.data : c))); break;
        }
      } catch (err) { console.error('SSE error:', err); }
    };
    eventSource.onerror = () => { console.warn('SSE disconnected'); eventSource.close(); };
    return () => eventSource.close();
  }, [isAuthorized]);

  const handleDesactivar = async (cliente: Cliente) => {
    const result = await Swal.fire({
      title: '¿Desactivar cliente?', text: `¿Seguro que deseas desactivar a "${cliente.razonSocial}"?`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, desactivar', cancelButtonText: 'Cancelar', reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/gestion/clientes/${cliente._id}`, { method: 'DELETE' });
      if (!res.ok) throw await res.json();
      Swal.fire({ icon: 'success', title: '¡Desactivado!', text: 'Cliente desactivado', timer: 2000, showConfirmButton: false });
      setClientes(prev => prev.map(c => (c._id === cliente._id ? { ...c, activo: false } : c)));
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.error || 'No se pudo desactivar el cliente.', confirmButtonColor: '#d33' });
    }
  };

  const handleReactivar = async (cliente: Cliente) => {
    const result = await Swal.fire({
      title: '¿Reactivar cliente?', text: `¿Seguro que deseas reactivar a "${cliente.razonSocial}"?`,
      icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, reactivar', cancelButtonText: 'Cancelar', reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/gestion/clientes/${cliente._id}`, { method: 'PATCH' });
      if (!res.ok) throw await res.json();
      Swal.fire({ icon: 'success', title: '¡Reactivado!', text: 'Cliente reactivado', timer: 2000, showConfirmButton: false });
      setClientes(prev => prev.map(c => (c._id === cliente._id ? { ...c, activo: true } : c)));
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.error || 'No se pudo reactivar el cliente.', confirmButtonColor: '#d33' });
    }
  };

  const actualizarUmbral = async (clienteId: string, umbral: number) => {
    try {
      const res = await fetch(`/api/gestion/cuentas-corrientes/alertas/${clienteId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ umbralDeuda: umbral })
      });
      if (!res.ok) throw new Error('Error al actualizar el umbral');
      setClientes(prev => prev.map(c => c._id === clienteId ? { ...c, alerta: { ...(c as any).alerta, umbralDeuda: umbral } } : c));
      toast.success('Umbral de alerta actualizado');
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el umbral.', confirmButtonColor: '#d33' });
    }
  };

  const editarUmbralConModal = async (cliente: Cliente) => {
    const { value: nuevoUmbral } = await Swal.fire({
      title: `Umbral para ${cliente.razonSocial}`, input: 'number',
      inputLabel: 'Monto mínimo para alerta (ARS)', inputValue: cliente.alerta?.umbralDeuda || 50000,
      inputAttributes: { min: '0' }, confirmButtonText: 'Guardar', showCancelButton: true,
      confirmButtonColor: '#8b5cf6', cancelButtonColor: '#6b7280'
    });
    if (nuevoUmbral !== null && !isNaN(Number(nuevoUmbral)) && Number(nuevoUmbral) >= 0) {
      actualizarUmbral(cliente._id, Number(nuevoUmbral));
    }
  };

  if (!isAuthorized || !mounted) return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-purple-500 border-r-violet-500 mx-auto mb-4" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 blur-xl animate-pulse" />
        </div>
        <p className={`${theme.textSecondary}`}>Validando acceso...</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  // 🎨 JSX CON ESTÉTICA PREMIUM (funcionalidad intacta)
  // ─────────────────────────────────────────────────────
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
        <header className="mb-8 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 mb-4">
                <FaUsers className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-slate-400">CRM Inmobiliario</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                  Gestión de Clientes
                </span>
              </h1>
              <p className={`${theme.textSecondary} text-base font-light`}>
                Administrá contactos, datos fiscales y condiciones comerciales
              </p>
            </div>
            <Link
              href="/gestion/clientes/nuevo"
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium text-sm tracking-wide overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/40 hover:scale-[1.02]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <FaPlus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Nuevo Cliente</span>
            </Link>
          </div>
          
          {/* 🔗 Breadcrumb */}
          <nav className="mt-4 flex items-center text-sm">
            <Link href="/gestion" className={`${theme.textSecondary} hover:${theme.textAccent} transition-colors flex items-center gap-1.5`}>
              <FaChevronLeft className="w-3 h-3" /> Gestión
            </Link>
            <span className={`${theme.textSecondary} mx-2`}>/</span>
            <span className="text-white font-medium">Clientes</span>
          </nav>
        </header>

        {/* 🔍 Barra de Búsqueda Premium */}
        <section className={`${theme.bgCard} ${theme.border} rounded-2xl p-4 mb-6 backdrop-blur-sm`}>
          <div className="relative max-w-xl">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por razón social, nombre, DNI, teléfono, email o forma de pago..."
              className={`w-full pl-11 pr-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all`}
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                ×
              </button>
            )}
          </div>
          {busqueda && (
            <p className={`${theme.textSecondary} text-xs mt-2 ml-1`}>
              {totalClientes} resultado{totalClientes !== 1 ? 's' : ''} para "{busqueda}"
            </p>
          )}
        </section>

        {/* 📋 Listado de Clientes - Cards Premium */}
        <section className={`${theme.bgCard} ${theme.border} rounded-2xl overflow-hidden backdrop-blur-sm ${theme.shadow}`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/60 mb-4 animate-pulse" />
              <p className={`${theme.textSecondary}`}>Cargando clientes...</p>
            </div>
          ) : clientesPaginados.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-4">
                <FaUserCircle className="w-8 h-8 text-slate-500" />
              </div>
              <p className={`${theme.textSecondary} text-lg`}>
                {busqueda ? 'No se encontraron clientes que coincidan.' : 'No hay clientes registrados.'}
              </p>
              {!busqueda && (
                <Link href="/gestion/clientes/nuevo" className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300 transition-colors">
                  <FaPlus className="w-4 h-4" /> Crear uno nuevo
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-700/50">
                {clientesPaginados.map((cliente) => {
                  const pagoStyle = getFormaPagoStyle(cliente.formaPago);
                  return (
                    <article 
                      key={cliente._id} 
                      className={`group p-5 transition-all duration-200 hover:${theme.bgCardHover} cursor-default`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        
                        {/* 👤 Información del Cliente */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0`}>
                              <span className="text-base font-semibold text-violet-400">{getInitials(cliente.nombre, cliente.apellido)}</span>
                            </div>
                            
                            {/* Datos */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-white font-semibold truncate">{cliente.razonSocial}</h3>
                                {!cliente.activo && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                    Inactivo
                                  </span>
                                )}
                                 {/* {cliente.alerta?.umbralDeuda && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30" title="Tiene umbral de alerta configurado">
                                    <FaBell className="w-2.5 h-2.5" /> Alerta
                                  </span>
                                )}*/}
                              </div>
                              
                              <p className="text-sm text-slate-400 mt-0.5">{cliente.nombre} {cliente.apellido}</p>
                              
                              {/* Contacto */}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                {cliente.telefono && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <FaPhoneAlt className="w-3 h-3" /> {cliente.telefono}
                                  </span>
                                )}
                                {cliente.email && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <FaEnvelope className="w-3 h-3" /> {cliente.email}
                                  </span>
                                )}
                                {cliente.dni && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <FaIdCard className="w-3 h-3" /> DNI: {cliente.dni}
                                  </span>
                                )}
                              </div>
                              
                              {/* Dirección */}
                              {(cliente.direccion || cliente.ciudad || cliente.provincia) && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                                  <FaMapMarkerAlt className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {[cliente.direccion, cliente.ciudad, cliente.provincia].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              {/* Forma de pago 
                              <div className="mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wide ${pagoStyle.bg} ${pagoStyle.text} border border-transparent`}>
                                  <FaCreditCard className="w-3 h-3" />
                                  {pagoStyle.label}
                                </span>
                              </div>*/}


                            </div>
                          </div>
                        </div>

                        {/* ⚡ Acciones */}
                        <div className="flex flex-wrap items-center justify-end gap-2 lg:border-l lg:border-slate-700/50 lg:pl-4">
                          <Link 
                            href={`/gestion/clientes/editar/${cliente._id}`} 
                            className="group/action inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                            title="Editar cliente"
                          >
                            <FaEdit className="w-3.5 h-3.5 group-hover/action:scale-110 transition-transform" />
                            <span className="hidden sm:inline">Editar</span>
                          </Link>
                          
                      
                          {cliente.activo ? (
                            <button 
                              onClick={() => handleDesactivar(cliente)} 
                              className="group/action inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              title="Desactivar cliente"
                            >
                              <FaBan className="w-3.5 h-3.5 group-hover/action:scale-110 transition-transform" />
                              <span className="hidden sm:inline">Desactivar</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleReactivar(cliente)} 
                              className="group/action inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                              title="Reactivar cliente"
                            >
                              <FaCheckCircle className="w-3.5 h-3.5 group-hover/action:scale-110 transition-transform" />
                              <span className="hidden sm:inline">Reactivar</span>
                            </button>
                          )}
                          

                            

                          {cliente.formaPago === 'cuenta_corriente' && (
                            <button
                              onClick={() => editarUmbralConModal(cliente)}
                              className="group/action inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                              title="Configurar umbral de alerta"
                            >
                              <FaBell className="w-3.5 h-3.5 group-hover/action:scale-110 transition-transform" />
                              <span className="hidden sm:inline">Umbral</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}




              </div>

              {/* 📄 Paginación Premium */}
              {totalPaginas > 1 && (
                <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-700/50">
                  <p className={`${theme.textSecondary} text-sm`}>
                    Mostrando <span className="text-white font-medium">{clientesPaginados.length}</span> de <span className="text-white font-medium">{totalClientes}</span> cliente(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className={`
                        group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${paginaActual === 1 
                          ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed' 
                          : 'bg-slate-800/60 text-white hover:bg-slate-700/60 hover:border-purple-500/40 border border-slate-700/50'
                        }
                      `}
                    >
                      <FaChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      Anterior
                    </button>
                    
                    <span className="px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-700/30 text-sm text-white font-medium">
                      {paginaActual} <span className="text-slate-500">de</span> {totalPaginas}
                    </span>
                    
                    <button
                      onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                      className={`
                        group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${paginaActual === totalPaginas 
                          ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed' 
                          : 'bg-slate-800/60 text-white hover:bg-slate-700/60 hover:border-purple-500/40 border border-slate-700/50'
                        }
                      `}
                    >
                      Siguiente
                      <FaChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* 📌 Footer informativo */}
        <footer className="mt-8 text-center">
          <p className={`${theme.textSecondary} text-[10px] tracking-[0.25em] uppercase flex items-center justify-center gap-2`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sincronizado en tiempo real • {new Date().toLocaleTimeString('es-AR')}
          </p>
        </footer>
      </div>
    </div>
  );
}




