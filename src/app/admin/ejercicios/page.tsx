'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDumbbell, faPlus, faTrash, faUserInjured, 
  faCalendarAlt, faNotesMedical, faSpinner, faCheckCircle, 
  faSearch, faTimes, faList, faEye
} from '@fortawesome/free-solid-svg-icons';

interface EjercicioLibreria {
  _id: string;
  nombre: string;
  categoria: string;
}

interface EjercicioEnPlan {
  ejercicioId: string;
  series: string;
  repeticiones: string;
  frecuencia: string;
  notasEspecificas: string;
}

export default function PlanesEjerciciosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [showLibraryForm, setShowLibraryForm] = useState(false);
  
  const [ejerciciosLibreria, setEjerciciosLibreria] = useState<EjercicioLibreria[]>([]);
  const [pacientesList, setPacientesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // ✅ Nuevo estado para la lista de planes ya asignados
  const [assignedPlans, setAssignedPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const [formData, setFormData] = useState({
    pacienteId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    notasGenerales: '',
    ejercicios: [] as EjercicioEnPlan[]
  });

  const [newExercise, setNewExercise] = useState({ nombre: '', categoria: '', videoUrl: '', descripcion: '' });
  const [savingExercise, setSavingExercise] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEjerciciosLibreria();
      fetchAssignedPlans(); // ✅ Cargar los planes al entrar
    }
  }, [status]);

  const fetchEjerciciosLibreria = async () => {
    try {
      const res = await fetch('/api/ejercicios'); 
      const data = await res.json();
      if (data.success) setEjerciciosLibreria(data.ejercicios);
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
    }
  };

  // ✅ Función para obtener los planes asignados por este profesional
  const fetchAssignedPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch('/api/planes-ejercicios');
      const data = await res.json();
      if (data.success) {
        setAssignedPlans(data.planes || []);
      }
    } catch (error) {
      console.error('Error cargando planes asignados:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchPacientesList = async (searchTerm: string) => {
    if (searchTerm.length < 2) { 
      setPacientesList([]); 
      setIsSearching(false); 
      return; 
    }
    setIsSearching(true);
    try {
      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`/api/pacientes?search=${encodeURIComponent(searchTerm)}&limit=15`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      }); 
      
      if (res.ok) { 
        const data = await res.json(); 
        setPacientesList(data.pacientes || []); 
      } else { 
        setPacientesList([]); 
      }
    } catch (error) { 
      setPacientesList([]); 
    } finally { 
      setIsSearching(false); 
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchPacientesList(value), 400);
  };

  const handleAddExerciseToLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.nombre || !newExercise.categoria) {
      toast.error('Nombre y categoría son obligatorios');
      return;
    }
    setSavingExercise(true);
    try {
      const res = await fetch('/api/ejercicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExercise)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Ejercicio agregado a la librería');
        setNewExercise({ nombre: '', categoria: '', videoUrl: '', descripcion: '' });
        fetchEjerciciosLibreria();
        setShowLibraryForm(false);
      } else {
        toast.error(data.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setSavingExercise(false);
    }
  };

  const addEjercicioToPlan = () => {
    setFormData({
      ...formData,
      ejercicios: [
        ...formData.ejercicios,
        { ejercicioId: '', series: '3', repeticiones: '10', frecuencia: 'Diario', notasEspecificas: '' }
      ]
    });
  };

  const updateEjercicioInPlan = (index: number, field: keyof EjercicioEnPlan, value: string) => {
    const nuevosEjercicios = [...formData.ejercicios];
    nuevosEjercicios[index] = { ...nuevosEjercicios[index], [field]: value };
    setFormData({ ...formData, ejercicios: nuevosEjercicios });
  };

  const removeEjercicioFromPlan = (index: number) => {
    const nuevosEjercicios = formData.ejercicios.filter((_, i) => i !== index);
    setFormData({ ...formData, ejercicios: nuevosEjercicios });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pacienteId || formData.ejercicios.length === 0) {
      toast.error('Selecciona un paciente y agrega al menos un ejercicio');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/planes-ejercicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Plan de ejercicios asignado exitosamente');
        setShowForm(false);
        setFormData({ pacienteId: '', fechaInicio: new Date().toISOString().split('T')[0], fechaFin: '', notasGenerales: '', ejercicios: [] });
        setSearchQuery('');
        fetchAssignedPlans(); // ✅ Recargar la lista para mostrar el nuevo plan
      } else {
        toast.error(data.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-sky-500 w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mt-40 mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faDumbbell} className="text-sky-500" />
              Planes de Ejercicios
            </h1>
            <p className="text-slate-400 text-sm mt-1">Asigna rutinas domiciliarias y realiza seguimiento.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowLibraryForm(true)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faList} /> Gestionar Librería
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} /> Nuevo Plan
            </button>
          </div>
        </div>

        {/* ✅ LISTA DE PLANES ASIGNADOS (Reemplaza el placeholder vacío) */}
        {loadingPlans ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
            <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-sky-500 mb-4" />
            <p className="text-slate-400">Cargando planes asignados...</p>
          </div>
        ) : assignedPlans.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
            <FontAwesomeIcon icon={faDumbbell} className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Aún no hay planes asignados</h3>
            <p className="text-slate-400 mb-6">Carga ejercicios en la librería y crea un nuevo plan para comenzar.</p>
            <button 
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} /> Crear Primer Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedPlans.map((plan: any) => (
              <div key={plan._id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-sky-500/30 transition-all">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faDumbbell} className="text-sky-400 text-xl" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white text-lg truncate">
                          Plan para {plan.paciente?.name} {plan.paciente?.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 flex-wrap">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                          <span>Asignado el {new Date(plan.createdAt).toLocaleDateString('es-AR')}</span>
                          <span className="text-slate-600">•</span>
                          <span>{plan.ejercicios?.length || 0} ejercicio{(plan.ejercicios?.length || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                        Activo
                      </span>
                    </div>
                  </div>

                  {/* Detalles rápidos del plan */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mt-4">
                    <div className="bg-slate-800/50 rounded-lg p-2.5">
                      <p className="text-slate-500 mb-0.5">Paciente</p>
                      <p className="text-white font-medium truncate">{plan.paciente?.name} {plan.paciente?.lastName}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2.5">
                      <p className="text-slate-500 mb-0.5">Inicio</p>
                      <p className="text-white font-medium">{new Date(plan.fechaInicio).toLocaleDateString('es-AR')}</p>
                    </div>
                    {plan.fechaFin && (
                      <div className="bg-slate-800/50 rounded-lg p-2.5">
                        <p className="text-slate-500 mb-0.5">Vigencia</p>
                        <p className="text-white font-medium">{new Date(plan.fechaFin).toLocaleDateString('es-AR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ MODAL PARA AGREGAR EJERCICIOS A LA LIBRERÍA */}
      {showLibraryForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faDumbbell} className="text-sky-500" /> 
                Agregar a la Librería
              </h2>
              <button onClick={() => setShowLibraryForm(false)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExerciseToLibrary} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre del Ejercicio *</label>
                <input 
                  type="text" 
                  value={newExercise.nombre} 
                  onChange={e => setNewExercise({...newExercise, nombre: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" 
                  placeholder="Ej: Sentadilla con peso corporal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Categoría *</label>
                <input 
                  type="text" 
                  value={newExercise.categoria} 
                  onChange={e => setNewExercise({...newExercise, categoria: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" 
                  placeholder="Ej: Rodilla, Columna, Hombro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Link de Video (YouTube, etc.)</label>
                <input 
                  type="url" 
                  value={newExercise.videoUrl} 
                  onChange={e => setNewExercise({...newExercise, videoUrl: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" 
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descripción breve</label>
                <textarea 
                  value={newExercise.descripcion} 
                  onChange={e => setNewExercise({...newExercise, descripcion: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" 
                  placeholder="Instrucciones clave..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowLibraryForm(false)} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={savingExercise} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                  {savingExercise ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheckCircle} />}
                  Guardar Ejercicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CREACIÓN DE PLAN */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faNotesMedical} className="text-sky-500" /> 
                Asignar Nuevo Plan de Ejercicios
              </h2>
              <button onClick={() => { setShowForm(false); setSearchQuery(''); setPacientesList([]); }} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Buscar Paciente *</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={isSearching ? faSpinner : faSearch} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSearching ? 'text-sky-500 animate-spin' : 'text-slate-500'}`} />
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={handleSearchChange} 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" 
                      placeholder="Escribe nombre o apellido del paciente (mín. 2 letras)..." 
                      autoComplete="off"
                    />
                  </div>
                  
                  {searchQuery.length >= 2 && (
                    <div className="mt-1 max-h-48 overflow-y-auto border border-slate-700 rounded-lg bg-slate-800 shadow-xl relative z-10">
                      {isSearching ? (
                        <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Buscando...
                        </div>
                      ) : pacientesList.length > 0 ? (
                        pacientesList.map((p: any) => (
                          <button 
                            key={p._id} 
                            type="button" 
                            onClick={() => { 
                              setFormData({ ...formData, pacienteId: p._id }); 
                              setSearchQuery(`${p.name} ${p.lastName}`); 
                              setPacientesList([]); 
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-sky-600/20 transition flex justify-between items-center border-b border-slate-700/50 last:border-0 ${formData.pacienteId === p._id ? 'bg-sky-600/30 text-sky-400' : 'text-slate-300'}`}
                          >
                            <div>
                              <span className="font-medium">{p.name} {p.lastName}</span>
                              {p.email && <span className="block text-xs text-slate-500">{p.email}</span>}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No se encontraron pacientes con "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formData.pacienteId && !isSearching && pacientesList.length === 0 && (
                     <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500" />
                        <span className="text-sm text-emerald-200 truncate">Paciente seleccionado correctamente</span>
                        <button type="button" onClick={() => { setFormData({...formData, pacienteId: ''}); setSearchQuery(''); }} className="ml-auto text-slate-400 hover:text-red-400 p-1" title="Limpiar">
                          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        </button>
                     </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Fecha de Inicio</label>
                  <input 
                    type="date" 
                    value={formData.fechaInicio} 
                    onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Vigencia / Fecha Fin (Opcional)</label>
                  <input 
                    type="date" 
                    value={formData.fechaFin} 
                    onChange={e => setFormData({...formData, fechaFin: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-sky-400">Ejercicios a realizar</h3>
                  <button 
                    type="button" 
                    onClick={addEjercicioToPlan}
                    className="text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Agregar Ejercicio
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.ejercicios.map((ej, index) => (
                    <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative">
                      <button 
                        type="button" 
                        onClick={() => removeEjercicioFromPlan(index)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition"
                        title="Quitar ejercicio"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                        <div className="md:col-span-5">
                          <label className="block text-xs text-slate-400 mb-1">Ejercicio *</label>
                          <select 
                            value={ej.ejercicioId} 
                            onChange={e => updateEjercicioInPlan(index, 'ejercicioId', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none"
                          >
                            <option value="">Seleccionar de la librería...</option>
                            {ejerciciosLibreria.map((elib: any) => (
                              <option key={elib._id} value={elib._id}>{elib.nombre} ({elib.categoria})</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-slate-400 mb-1">Series</label>
                          <input 
                            type="text" value={ej.series} onChange={e => updateEjercicioInPlan(index, 'series', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none" placeholder="Ej: 3"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-slate-400 mb-1">Reps</label>
                          <input 
                            type="text" value={ej.repeticiones} onChange={e => updateEjercicioInPlan(index, 'repeticiones', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none" placeholder="Ej: 15"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs text-slate-400 mb-1">Frecuencia</label>
                          <input 
                            type="text" value={ej.frecuencia} onChange={e => updateEjercicioInPlan(index, 'frecuencia', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none" placeholder="Ej: Diario"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Notas específicas</label>
                        <input 
                          type="text" value={ej.notasEspecificas} onChange={e => updateEjercicioInPlan(index, 'notasEspecificas', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 focus:outline-none" placeholder="Ej: Mantener 5 seg, sin dolor"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {formData.ejercicios.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 text-sm">
                      No hay ejercicios agregados. Haz clic en "Agregar Ejercicio".
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Indicaciones Generales (Opcional)</label>
                <textarea 
                  value={formData.notasGenerales} 
                  onChange={e => setFormData({...formData, notasGenerales: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none"
                  placeholder="Ej: Aplicar calor local 10 minutos antes de comenzar la rutina."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => { setShowForm(false); setSearchQuery(''); setPacientesList([]); }} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                  {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheckCircle} />}
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}