'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, faEnvelope, faTrash, 
  faToggleOn, faToggleOff, faSpinner, faSearch, faUserClock 
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

interface Alerta {
  _id: string;
  usuario: { name: string; lastName: string; email: string; phone: string };
  profesional: { nombre: string; especialidad: string };
  diasPreferidos: string[];
  canal: 'email' | 'whatsapp' | 'ambos';
  activo: boolean;
  createdAt: string;
}

export default function ListaEsperaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtroProf, setFiltroProf] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/lista-espera');
      return;
    }
    if (status === 'authenticated') fetchAlertas();
  }, [status, router, filtroProf]);

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      const url = filtroProf 
        ? `/api/admin/lista-espera?profesionalId=${encodeURIComponent(filtroProf)}`
        : '/api/admin/lista-espera';
        
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setAlertas(data.alertas);
    } catch (error) {
      toast.error('Error al cargar la lista de espera');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (id: string, current: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/lista-espera?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !current })
      });
      if (res.ok) {
        setAlertas(prev => prev.map(a => a._id === id ? { ...a, activo: !current } : a));
        toast.success(!current ? 'Alerta activada' : 'Alerta pausada');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const eliminarAlerta = async (id: string, paciente: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar esta alerta?',
      text: `Se eliminará la solicitud de ${paciente}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      background: '#0f172a',
      color: '#f1f5f9',
      customClass: { popup: 'border border-slate-700 rounded-2xl' }
    });

    if (!result.isConfirmed) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/lista-espera?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlertas(prev => prev.filter(a => a._id !== id));
        toast.success('Alerta eliminada correctamente');
      }
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ FUNCIÓN KILLER: Abrir WhatsApp con mensaje pre-escrito
  const contactarWhatsApp = (alerta: Alerta) => {
    const phone = alerta.usuario.phone.replace(/\D/g, ''); // Limpiar solo números
    const nombre = alerta.usuario.name;
    const prof = alerta.profesional.nombre;
    const dias = alerta.diasPreferidos.join(', ');
    
    const mensaje = `Hola ${nombre} 👋, te escribimos del equipo de Kinesiología. Se ha liberado un turno con ${prof} en los días que preferías (${dias}). ¿Te gustaría que te lo agendemos?`;
    const url = `https://wa.me/549${phone}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faUserClock} className="text-sky-500" />
              Lista de Espera y Alertas
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gestiona las solicitudes de pacientes que esperan un turno libre.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Filtrar por profesional..."
                value={filtroProf}
                onChange={(e) => setFiltroProf(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Tabla de Alertas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {alertas.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FontAwesomeIcon icon={faBell} className="w-12 h-12 mb-4 opacity-30" />
              <p>No hay alertas registradas {filtroProf && 'para este profesional'}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4">Profesional Solicitado</th>
                    <th className="px-6 py-4">Días Preferidos</th>
                    <th className="px-6 py-4">Canal</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {alertas.map((alerta) => (
                    <tr key={alerta._id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{alerta.usuario.name} {alerta.usuario.lastName}</div>
                        <div className="text-xs text-slate-500">{alerta.usuario.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sky-400 font-medium">{alerta.profesional.nombre}</div>
                        <div className="text-xs text-slate-500">{alerta.profesional.especialidad}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {alerta.diasPreferidos.map(dia => (
                            <span key={dia} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300">
                              {dia}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-300 capitalize">
                          {alerta.canal === 'whatsapp' && <FontAwesomeIcon icon={faWhatsapp} className="text-green-500" />}
                          {alerta.canal === 'email' && <FontAwesomeIcon icon={faEnvelope} className="text-sky-500" />}
                          {alerta.canal === 'ambos' && <FontAwesomeIcon icon={faBell} className="text-amber-500" />}
                          {alerta.canal}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleActivo(alerta._id, alerta.activo)}
                          disabled={actionLoading === alerta._id}
                          className={`p-2 rounded-lg transition-all ${alerta.activo ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:bg-slate-700/50'}`}
                        >
                          {actionLoading === alerta._id ? (
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                          ) : alerta.activo ? (
                            <FontAwesomeIcon icon={faToggleOn} className="w-6 h-6" title="Desactivar" />
                          ) : (
                            <FontAwesomeIcon icon={faToggleOff} className="w-6 h-6" title="Activar" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {alerta.usuario.phone && (
                            <button 
                              onClick={() => contactarWhatsApp(alerta)}
                              className="p-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition"
                              title="Contactar por WhatsApp"
                            >
                              <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => eliminarAlerta(alerta._id, `${alerta.usuario.name} ${alerta.usuario.lastName}`)}
                            disabled={actionLoading === alerta._id}
                            className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                            title="Eliminar alerta (ya se agendó)"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}