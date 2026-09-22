'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHospital, faPlus, faEdit, faTrash, faSave, faTimes, 
  faSpinner, faCheckCircle, faBuilding
} from '@fortawesome/free-solid-svg-icons';
import { FaArrowLeft } from 'react-icons/fa';

interface ObraSocial {
  _id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  planes: {
    nombre: string;
    codigo: string;
    cobertura: number;
    requiereAutorizacion: boolean;
  }[];
}

export default function ObrasSocialesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    planes: [{ nombre: '', codigo: '', cobertura: 70, requiereAutorizacion: false }]
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/obras-sociales');
      return;
    }
    if (status === 'authenticated') fetchObrasSociales();
  }, [status, router]);

  const fetchObrasSociales = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/obras-sociales?activas=false');
      const data = await res.json();
      if (data.success) {
        setObrasSociales(data.obrasSociales);
      }
    } catch (error) {
      toast.error('Error al cargar obras sociales');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.codigo) {
      toast.error('Nombre y código son obligatorios');
      return;
    }

    try {
      const url = editingId 
        ? `/api/obras-sociales?id=${editingId}`
        : '/api/obras-sociales';
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(editingId ? '✅ Obra social actualizada' : '✅ Obra social creada');
        setShowForm(false);
        setEditingId(null);
        setFormData({ nombre: '', codigo: '', planes: [{ nombre: '', codigo: '', cobertura: 70, requiereAutorizacion: false }] });
        fetchObrasSociales();
      } else {
        toast.error(data.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleEdit = (os: ObraSocial) => {
    setFormData({
      nombre: os.nombre,
      codigo: os.codigo,
      planes: os.planes.length > 0 ? os.planes : [{ nombre: '', codigo: '', cobertura: 70, requiereAutorizacion: false }]
    });
    setEditingId(os._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    const result = await Swal.fire({
      title: `¿Desactivar ${nombre}?`,
      text: 'Esta obra social dejará de estar disponible para nuevos pacientes.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#0f172a',
      color: '#f1f5f9',
      customClass: { popup: 'border border-slate-700 rounded-xl' }
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/obras-sociales?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Obra social desactivada');
        fetchObrasSociales();
      } else {
        toast.error(data.message || 'Error al desactivar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const addPlan = () => {
    setFormData({
      ...formData,
      planes: [...formData.planes, { nombre: '', codigo: '', cobertura: 70, requiereAutorizacion: false }]
    });
  };

  const removePlan = (index: number) => {
    const nuevosPlanes = formData.planes.filter((_, i) => i !== index);
    setFormData({ ...formData, planes: nuevosPlanes });
  };

  const updatePlan = (index: number, field: string, value: any) => {
    const nuevosPlanes = [...formData.planes];
    nuevosPlanes[index] = { ...nuevosPlanes[index], [field]: value };
    setFormData({ ...formData, planes: nuevosPlanes });
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
      <div className="max-w-6xl mt-40 mx-auto">
            <button 
                onClick={() => router.push('/gestion')} 
                className="inline-flex  items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-8 group w-fit"
              >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
                Volver al Panel Principal
              </button>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faHospital} className="text-sky-500" />
              Gestión de Obras Sociales
            </h1>
            <p className="text-slate-400 text-sm mt-1">Configura las prestadoras, planes y coberturas.</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ nombre: '', codigo: '', planes: [{ nombre: '', codigo: '', cobertura: 70, requiereAutorizacion: false }] }); }}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} /> Nueva Obra Social
          </button>
        </div>

        {!showForm ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {obrasSociales.length === 0 ? (
              <div className="col-span-full bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                <FontAwesomeIcon icon={faBuilding} className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No hay obras sociales registradas</h3>
                <p className="text-slate-400">Comienza agregando las obras sociales con las que trabaja el centro.</p>
              </div>
            ) : (
              obrasSociales.map((os) => (
                <div key={os._id} className={`bg-slate-900 border rounded-xl p-6 transition-all ${os.activo ? 'border-slate-800 hover:border-sky-500/30' : 'border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{os.nombre}</h3>
                      <p className="text-xs text-slate-400">Código: {os.codigo}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${os.activo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                      {os.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  
                  {os.planes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">{os.planes.length} plan(es):</p>
                      <div className="space-y-1">
                        {os.planes.map((plan, idx) => (
                          <div key={idx} className="text-xs text-slate-300 flex justify-between">
                            <span>{plan.nombre}</span>
                            <span className="text-sky-400">{plan.cobertura}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(os)}
                      className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Editar
                    </button>
                    {os.activo && (
                      <button
                        onClick={() => handleDelete(os._id, os.nombre)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* FORMULARIO DE OBRA SOCIAL */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Obra Social' : 'Nueva Obra Social'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nombre de la Obra Social *</label>
                  <input
                    required
                    placeholder="Ej: OSDE, Swiss Medical, Galeno..."
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Código *</label>
                  <input
                    required
                    placeholder="Ej: OSDE-400, SWISS-001"
                    value={formData.codigo}
                    onChange={e => setFormData({...formData, codigo: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECCIÓN DE PLANES */}
              <div className="border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Planes y Coberturas</h3>
                  <button
                    type="button"
                    onClick={addPlan}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm transition flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Agregar Plan
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.planes.map((plan, index) => (
                    <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-sky-400">Plan {index + 1}</span>
                        {formData.planes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlan(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            <FontAwesomeIcon icon={faTimes} /> Eliminar
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Nombre del Plan</label>
                          <input
                            placeholder="Ej: Plan A, Plan Oro..."
                            value={plan.nombre}
                            onChange={e => updatePlan(index, 'nombre', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Código del Plan</label>
                          <input
                            placeholder="Ej: PLAN-A-001"
                            value={plan.codigo}
                            onChange={e => updatePlan(index, 'codigo', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Cobertura (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={plan.cobertura}
                            onChange={e => updatePlan(index, 'cobertura', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={plan.requiereAutorizacion}
                            onChange={e => updatePlan(index, 'requiereAutorizacion', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 text-sky-500 focus:ring-sky-500 bg-slate-800"
                          />
                          <span className="text-sm text-slate-300">Requiere autorización previa</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} /> Guardar Obra Social
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}