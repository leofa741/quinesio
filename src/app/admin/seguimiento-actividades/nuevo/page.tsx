'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faSpinner, faUserMd, faUser, faClock, faNotesMedical, faCalendarCheck, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
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
    montoTotal: 0,
    montoProfesional: 0,
  });

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

  const handleTurnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const turnoId = e.target.value;
    const turnoSeleccionado = turnosCompletados.find((t: any) => t._id === turnoId);

    if (turnoSeleccionado) {
      const montoT = turnoSeleccionado.valorAcordado || turnoSeleccionado.montoTotal || 0;
      
      // 🔑 SOLUCIÓN: Primero usamos el valor de sesión real del profesional. 
      // Solo si no existe, calculamos el 70% del total del turno.
      const valorSesionProf = turnoSeleccionado.profesional?.honorarios?.valorSesion || 0;
      const montoP = turnoSeleccionado.montoProfesional || valorSesionProf || (montoT > 0 ? Math.round(montoT * 0.70) : 0);

      setFormData({
        turnoId: turnoSeleccionado._id,
        profesionalId: turnoSeleccionado.profesionalId || formData.profesionalId,
        profesionalNombre: turnoSeleccionado.profesionalNombre || formData.profesionalNombre,
        pacienteNombre: turnoSeleccionado.pacienteNombre || turnoSeleccionado.paciente?.nombre || '',
        fecha: new Date(turnoSeleccionado.fecha).toISOString().split('T')[0],
        duracionMinutos: turnoSeleccionado.duracionMinutos || turnoSeleccionado.duracion || 60,
        tipoSesion: turnoSeleccionado.especialidad || turnoSeleccionado.tipoSesion || 'Rehabilitación',
        notas: '',
        montoTotal: montoT,
        montoProfesional: montoP, // ¡Ahora mostrará 250 si ese es el valor del profesional!
      });
    } else {
      setFormData(prev => ({ ...prev, turnoId: '', pacienteNombre: '', duracionMinutos: 60, montoTotal: 0, montoProfesional: 0 }));
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
        Swal.fire({
          icon: 'success',
          title: '¡Actividad y Pagos Registrados!',
          text: 'La sesión se guardó y los montos se actualizaron en el módulo de Pagos.',
          timer: 2000,
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
            <p className="text-slate-400">Vincula un turno, registra la sesión y confirma los montos a cobrar/pagar.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6">
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 mb-6">
            <label className="block text-sm font-bold text-sky-300 mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarCheck} /> ¿El paciente ya tuvo su turno? Selecciónalo aquí:
            </label>
            <select value={formData.turnoId} onChange={handleTurnoChange} className="w-full bg-slate-900 border border-sky-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all">
              <option value="">-- Seleccionar turno atendido reciente --</option>
              {turnosCompletados.map((turno: any) => (
                <option key={turno._id} value={turno._id}>
                  {new Date(turno.fecha).toLocaleDateString('es-AR')} - {turno.pacienteNombre} ({turno.especialidad || turno.tipoSesion})
                </option>
              ))}
              <option value="manual">-- Ingreso manual (sin turno previo) --</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faUserMd} className="text-sky-400" /> Profesional
              </label>
              <input type="text" name="profesionalNombre" value={formData.profesionalNombre} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-sky-400" /> Nombre del Paciente
              </label>
              <input type="text" name="pacienteNombre" value={formData.pacienteNombre} onChange={handleChange} placeholder="Se llena automático o escribe manualmente" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" required />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-emerald-400" /> Detalles del Cobro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Monto Total a Cobrar (Paciente/OS)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input type="number" name="montoTotal" value={formData.montoTotal} onChange={handleChange} min="0" className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-8 pr-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Monto para el Profesional</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input type="number" name="montoProfesional" value={formData.montoProfesional} onChange={handleChange} min="0" className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-8 pr-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" placeholder="0" />
                </div>
                <p className="text-xs text-slate-500 mt-1">* Se sugiere el valor de sesión del profesional. Editable si es necesario.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fecha</label>
              <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-sky-400" /> Duración (min)
              </label>
              <input type="number" name="duracionMinutos" value={formData.duracionMinutos} onChange={handleChange} min="15" step="15" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Sesión</label>
              <select name="tipoSesion" value={formData.tipoSesion} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" required>
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
              <FontAwesomeIcon icon={faNotesMedical} className="text-sky-400" /> Notas Clínicas
            </label>
            <textarea name="notas" value={formData.notas} onChange={handleChange} rows={3} placeholder="Evolución, ejercicios indicados u observaciones..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none" />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl text-slate-300 hover:bg-slate-700 transition-all font-medium" disabled={loading}>Cancelar</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-sky-500/50 transition-all font-medium disabled:opacity-50">
              <FontAwesomeIcon icon={loading ? faSpinner : faSave} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Procesando...' : 'Confirmar y Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}