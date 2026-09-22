'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, faSpinner, faCheckCircle, faHourglassHalf, 
  faUserMd, faFilter, faEdit, faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';

export default function PagosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [turnos, setTurnos] = useState<any[]>([]);
  const [resumen, setResumen] = useState({ porCobrar: 0, porPagar: 0 });
  const [loading, setLoading] = useState(true);
  
  // ✅ NUEVO ESTADO: Para guardar la lista de profesionales
  const [profesionales, setProfesionales] = useState<any[]>([]);
  
  // Filtros
  const [filtroProf, setFiltroProf] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendiente'); // 'pendiente' | 'todos'

  // Edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // ✅ Cargar profesionales al autenticar
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfesionales();
    }
  }, [status]);

  // ✅ Cargar pagos cuando cambian los filtros o al autenticar
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/pagos');
      return;
    }
    if (status === 'authenticated') {
      fetchPagos();
    }
  }, [status, router, filtroProf, filtroEstado]);

  const fetchProfesionales = async () => {
    try {
      const res = await fetch('/api/admin/profesionales');
      const data = await res.json();
      if (data.success) {
        setProfesionales(data.profesionales);
      }
    } catch (error) {
      console.error('Error cargando profesionales:', error);
    }
  };

  const fetchPagos = async () => {
    setLoading(true);
    try {
      let url = `/api/pagos?estadoPago=${filtroEstado}`;
      if (filtroProf) url += `&profesionalId=${filtroProf}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTurnos(data.turnos);
        setResumen(data.resumen);
      }
    } catch (error) {
      toast.error('Error al cargar los datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (turno: any) => {
    setEditingId(turno._id);
    setEditData({
      montoTotal: turno.montoTotal || turno.profesional?.honorarios?.valorSesion || 0,
      montoProfesional: turno.montoProfesional || Math.round((turno.profesional?.honorarios?.valorSesion || 0) * 0.7), // Ej: 70%
      estadoPagoPaciente: turno.estadoPagoPaciente || 'pendiente',
      estadoPagoProfesional: turno.estadoPagoProfesional || 'pendiente',
      metodoPago: turno.metodoPago || 'efectivo',
      observacionesPago: turno.observacionesPago || ''
    });
  };

  const savePayment = async (id: string) => {
    try {
      const res = await fetch(`/api/pagos?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Estado de pago actualizado');
        setEditingId(null);
        fetchPagos(); // Recargar
      } else {
        toast.error(data.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-emerald-500" />
              Gestión de Pagos y Liquidaciones
            </h1>
            <p className="text-slate-400 text-sm mt-1">Controla lo cobrado a pacientes y lo liquidado a profesionales.</p>
          </div>
        </div>

        {/* ✅ TARJETAS DE RESUMEN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Pendiente por Cobrar (Pacientes/OS)</p>
              <p className="text-3xl font-bold text-amber-400">
                ${resumen.porCobrar.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faHourglassHalf} className="text-amber-400 text-xl" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Pendiente por Pagar (Profesionales)</p>
              <p className="text-3xl font-bold text-rose-400">
                ${resumen.porPagar.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUserMd} className="text-rose-400 text-xl" />
            </div>
          </div>
        </div>

        {/* ✅ FILTROS (Ahora con profesionales dinámicos) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs text-slate-400 mb-1">Filtrar por Profesional</label>
            <select 
              value={filtroProf} 
              onChange={(e) => setFiltroProf(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none appearance-none"
            >
              <option value="">👨‍⚕️ Todos los profesionales</option>
              {profesionales.map((prof) => (
                <option key={prof._id} value={prof._id}>
                  {prof.name} {prof.lastName} {prof.especialidades?.length > 0 ? `(${prof.especialidades[0]})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-xs text-slate-400 mb-1">Estado de Liquidación</label>
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none appearance-none"
            >
              <option value="pendiente">⏳ Solo Pendientes</option>
              <option value="todos">📋 Todos (Incluye liquidados)</option>
            </select>
          </div>
        </div>

        {/* ✅ TABLA DE LIQUIDACIONES */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Fecha / Paciente</th>
                  <th className="px-6 py-4">Profesional</th>
                  <th className="px-6 py-4">Obra Social</th>
                  <th className="px-6 py-4 text-right">Monto Total</th>
                  <th className="px-6 py-4 text-center">Estado Cobro</th>
                  <th className="px-6 py-4 text-center">Estado Liquidación</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {turnos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {filtroEstado === 'pendiente' 
                        ? '🎉 ¡Excelente! No hay pagos ni liquidaciones pendientes.' 
                        : 'No se encontraron turnos completados con los filtros actuales.'}
                    </td>
                  </tr>
                ) : (
                  turnos.map((turno: any) => {
                    const isEditing = editingId === turno._id;
                    return (
                      <tr key={turno._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{turno.paciente?.name} {turno.paciente?.lastName}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(turno.fechaInicio).toLocaleDateString('es-AR')} {' '}
                            {new Date(turno.fechaInicio).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {turno.profesional?.name} {turno.profesional?.lastName}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                            {turno.paciente?.obraSocial?.nombre || 'Particular'}
                          </span>
                        </td>
                        
                        {/* Columna de Montos (Editable) */}
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex flex-col gap-1 items-end">
                              <input 
                                type="number" 
                                value={editData.montoTotal} 
                                onChange={e => setEditData({...editData, montoTotal: Number(e.target.value)})}
                                className="w-24 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-right text-white text-sm focus:border-sky-500 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-500">Al Profesional: 
                                <input 
                                  type="number" 
                                  value={editData.montoProfesional} 
                                  onChange={e => setEditData({...editData, montoProfesional: Number(e.target.value)})}
                                  className="w-16 px-1 ml-1 bg-slate-800 border border-slate-600 rounded text-right text-white text-xs focus:border-sky-500 focus:outline-none"
                                />
                              </span>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-white">${(turno.montoTotal || 0).toLocaleString('es-AR')}</p>
                              <p className="text-xs text-slate-500">Al Profesional: ${(turno.montoProfesional || 0).toLocaleString('es-AR')}</p>
                            </div>
                          )}
                        </td>

                        {/* Estados (Editables) */}
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <select 
                              value={editData.estadoPagoPaciente}
                              onChange={e => setEditData({...editData, estadoPagoPaciente: e.target.value})}
                              className="bg-slate-800 border border-slate-600 rounded text-xs text-white px-2 py-1 focus:border-sky-500 focus:outline-none"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="pagado">Pagado</option>
                              <option value="parcial">Parcial</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              turno.estadoPagoPaciente === 'pagado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {turno.estadoPagoPaciente === 'pagado' ? <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" /> : <FontAwesomeIcon icon={faHourglassHalf} className="w-3 h-3" />}
                              {turno.estadoPagoPaciente}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <select 
                              value={editData.estadoPagoProfesional}
                              onChange={e => setEditData({...editData, estadoPagoProfesional: e.target.value})}
                              className="bg-slate-800 border border-slate-600 rounded text-xs text-white px-2 py-1 focus:border-sky-500 focus:outline-none"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="liquidado">Liquidado</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              turno.estadoPagoProfesional === 'liquidado' ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {turno.estadoPagoProfesional === 'liquidado' ? <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" /> : <FontAwesomeIcon icon={faHourglassHalf} className="w-3 h-3" />}
                              {turno.estadoPagoProfesional}
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => savePayment(turno._id)} className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition" title="Guardar">
                                <FontAwesomeIcon icon={faSave} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition" title="Cancelar">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEditing(turno)} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition" title="Editar montos y estados">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}