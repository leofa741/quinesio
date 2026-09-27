'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faSpinner, faUserMd, faUser, faClock, faNotesMedical, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

export default function NuevaActividadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [turnosCompletados, setTurnosCompletados] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    turnoId: '',
    profesionalId: (session?.user as any)?.id || '',
    profesionalNombre: (session?.user as any)?.name || '',
    pacienteNombre: '',
    fecha: new Date().toISOString().split('T')[0],
    duracionMinutos: 60,
    tipoSesion: 'Rehabilitación',
    notas: '',
  });

  // 1. Cargar turnos completados al entrar
  useEffect(() => {
    const fetchTurnos = async () => {
      try {
        const res = await fetch('/api/gestion/turnos/completados');
        if (res.ok) {
          const data = await res.json();
          setTurnosCompletados(data);
        }
      } catch (error) {
        console.error('Error cargando turnos:', error);
      }
    };
    fetchTurnos();
  }, []);

  // 2. Función mágica: Auto-rellenar al seleccionar un turno
  const handleTurnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const turnoId = e.target.value;
    const turnoSeleccionado = turnosCompletados.find((t: any) => t._id === turnoId);

    if (turnoSeleccionado) {
      setFormData({
        turnoId: turnoSeleccionado._id,
        profesionalId: turnoSeleccionado.profesionalId || formData.profesionalId,
        profesionalNombre: turnoSeleccionado.profesionalNombre || formData.profesionalNombre,
        pacienteNombre: turnoSeleccionado.pacienteNombre || turnoSeleccionado.paciente?.nombre || '',
        fecha: new Date(turnoSeleccionado.fecha).toISOString().split('T')[0],
        duracionMinutos: turnoSeleccionado.duracionMinutos || turnoSeleccionado.duracion || 60,
        tipoSesion: turnoSeleccionado.especialidad || turnoSeleccionado.tipoSesion || 'Rehabilitación',
        notas: '', 
      });
    } else {
      setFormData(prev => ({ ...prev, turnoId: '', pacienteNombre: '', duracionMinutos: 60 }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pacienteNombre) {
      Swal.fire('Atención', 'Debes seleccionar un turno o escribir el nombre del paciente', 'warning');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/gestion/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // ✅ ÚNICO CAMBIO: Mensaje de éxito más descriptivo
        Swal.fire({
          icon: 'success',
          title: '¡Actividad y Pago Registrados!',
          text: 'La sesión se guardó y los montos del turno se actualizaron automáticamente en el módulo de Pagos.',
          timer: 2500,
          showConfirmButton: false
        });
        router.push('/admin/seguimiento-actividades');
        router.refresh();
      } else {
        const errorData = await res.json();
        Swal.fire('Error', errorData.message || 'No se pudo registrar', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Ocurrió un error de red', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto mt-40">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Registrar Actividad</h1>
            <p className="text-slate-400">Vincula un turno atendido para registrar la sesión y liquidar automáticamente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6">
          
          {/* 🔗 SELECTOR DE TURNO COMPLETADO */}
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 mb-6">
            <label className="block text-sm font-bold text-sky-300 mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarCheck} /> ¿El paciente ya tuvo su turno? Selecciónalo aquí:
            </label>
            <select
              value={formData.turnoId}
              onChange={handleTurnoChange}
              className="w-full bg-slate-900 border border-sky-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            >
              <option value="">-- Seleccionar turno atendido reciente --</option>
              {turnosCompletados.map((turno: any) => (
                <option key={turno._id} value={turno._id}>
                  {new Date(turno.fecha).toLocaleDateString('es-AR')} - {turno.pacienteNombre} ({turno.especialidad || turno.tipoSesion})
                </option>
              ))}
              <option value="manual">-- Ingreso manual (sin turno previo) --</option>
            </select>
            <p className="text-xs text-slate-400 mt-2">
              * Al seleccionar un turno, los datos se completarán y el sistema calculará los honorarios automáticamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faUserMd} className="text-sky-400" /> Profesional
              </label>
              <input
                type="text"
                name="profesionalNombre"
                value={formData.profesionalNombre}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-sky-400" /> Nombre del Paciente
              </label>
              <input
                type="text"
                name="pacienteNombre"
                value={formData.pacienteNombre}
                onChange={handleChange}
                placeholder="Se llena automático o escribe manualmente"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-sky-400" /> Duración (min)
              </label>
              <input
                type="number"
                name="duracionMinutos"
                value={formData.duracionMinutos}
                onChange={handleChange}
                min="15"
                step="15"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Sesión</label>
              <select
                name="tipoSesion"
                value={formData.tipoSesion}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                required
              >
                <option value="Rehabilitación">Rehabilitación</option>
                <option value="Kinesiología Deportiva">Kinesiología Deportiva</option>
                <option value="Pilates Reformer">Pilates Reformer</option>
                <option value="Masoterapia">Masoterapia</option>
                <option value="Neurología">Neurología</option>
                <option value="Evaluación Inicial">Evaluación Inicial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faNotesMedical} className="text-sky-400" /> Notas Clínicas de la sesión
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              placeholder="Evolución, ejercicios indicados u observaciones..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl text-slate-300 hover:bg-slate-700 transition-all font-medium" disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-sky-500/50 transition-all font-medium disabled:opacity-50"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faSave} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Procesando...' : 'Confirmar y Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}