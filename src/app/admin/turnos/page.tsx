'use client';

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faClock, faTimes, faSave, faCheckCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

interface Profesional {
  _id: string;
  name: string;
  lastName: string;
}

export default function AgendaTurnosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const calendarRef = useRef<any>(null);

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [selectedProf, setSelectedProf] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Estado para el modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    pacienteId: '', pacienteNombre: '', motivo: '', hora: '09:00', duracion: 60,
  });

  // ✅ NUEVO: Estado para el modal de acción (Confirmar/Cancelar)
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/turnos');
      return;
    }
    if (status === 'authenticated') fetchProfesionales();
  }, [status, router]);

  const fetchProfesionales = async () => {
    try {
      const res = await fetch('/api/admin/profesionales');
      const data = await res.json();
      if (data.success) {
        setProfesionales(data.profesionales);
        if (data.profesionales.length > 0 && !selectedProf) setSelectedProf(data.profesionales[0]._id);
      }
    } catch (error) {
      toast.error('Error al cargar profesionales');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchEvents = async (startStr: string, endStr: string) => {
    if (!selectedProf) return;
    try {
      const res = await fetch(`/api/turnos?profesionalId=${selectedProf}&start=${startStr}&end=${endStr}`);
      const data = await res.json();
      if (data.success) setEvents(data.eventos);
    } catch (error) {
      console.error('Error al cargar la agenda:', error);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    setFormData(prev => ({ ...prev, hora: selectInfo.startStr.split('T')[1].substring(0, 5) }));
    setIsModalOpen(true);
  };

  // ✅ MEJORADO: Al hacer clic, abrimos un modal claro si está pendiente
  const handleEventClick = (info: any) => {
    const turno = {
      id: info.event.id,
      title: info.event.title,
      estado: info.event.extendedProps.estado,
      motivo: info.event.extendedProps.motivo,
      start: info.event.start,
    };
    setSelectedTurno(turno);
    
    if (turno.estado === 'pendiente') {
      setActionModalOpen(true);
    } else {
      toast.info(`Turno ${turno.estado.toUpperCase()}\nPaciente: ${turno.title}\nMotivo: ${turno.motivo || 'N/A'}`);
    }
  };

  // ✅ NUEVO: Función para confirmar desde el modal
  const handleConfirmTurno = async () => {
    if (!selectedTurno) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/turnos?id=${selectedTurno.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'confirmado' })
      });
      if (res.ok) {
        toast.success('✅ Turno confirmado y paciente notificado por correo');
        setActionModalOpen(false);
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
      } else {
        toast.error('Error al confirmar el turno');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ✅ NUEVO: Función para cancelar desde el modal
  const handleCancelTurno = async () => {
    if (!selectedTurno) return;
    if (!confirm('¿Estás seguro de cancelar este turno? Se notificará al paciente.')) return;
    
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/turnos?id=${selectedTurno.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelado', motivoCancelacion: 'Cancelado desde la agenda' })
      });
      if (res.ok) {
        toast.success('❌ Turno cancelado y paciente notificado');
        setActionModalOpen(false);
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
      } else {
        toast.error('Error al cancelar el turno');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.pacienteId || !formData.pacienteNombre) {
      toast.error('Completa el ID y nombre del paciente');
      return;
    }

    const [hours, minutes] = formData.hora.split(':');
    const fechaInicio = new Date(selectedDate);
    fechaInicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + formData.duracion);

    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId: formData.pacienteId,
          profesionalId: selectedProf,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          duracionMinutos: formData.duracion,
          motivoConsulta: formData.motivo,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Turno creado y notificaciones enviadas');
        setIsModalOpen(false);
        setFormData(prev => ({ ...prev, pacienteId: '', pacienteNombre: '', motivo: '' }));
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
      } else {
        toast.error(data.message || 'Error al crear el turno');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  if (status === 'loading' || isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mt-40 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faClock} className="text-sky-500" />
              Agenda de Turnos
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gestiona la disponibilidad, recepciona y confirma reservas.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedProf}
              onChange={(e) => {
                setSelectedProf(e.target.value);
                const calendarApi = calendarRef.current?.getApi();
                if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
              }}
              className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
            >
              {profesionales.map(p => (
                <option key={p._id} value={p._id}>{p.name} {p.lastName}</option>
              ))}
            </select>
            <button
              onClick={() => { setSelectedDate(new Date()); setIsModalOpen(true); }}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCalendarPlus} /> Nuevo Turno
            </button>
          </div>
        </div>

        {/* Leyenda de colores para mejor UX */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pendiente (Haz clic para confirmar)</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Confirmado</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Cancelado</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl fc-theme-dark">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' }}
            locale="es"
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            selectable={true}
            select={handleDateSelect}
            events={events}
            datesSet={(dateInfo) => fetchEvents(dateInfo.start.toISOString(), dateInfo.end.toISOString())}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>
      </div>

      {/* Modal de Creación de Turno (Existente) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Agendar Nuevo Turno</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitTurno} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">ID del Paciente</label>
                <input type="text" value={formData.pacienteId} onChange={e => setFormData({ ...formData, pacienteId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none font-mono text-sm" placeholder="Ej: 6aab0620b5f21e7711b02419" required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre del Paciente</label>
                <input type="text" value={formData.pacienteNombre} onChange={e => setFormData({ ...formData, pacienteNombre: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" placeholder="Nombre completo" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                  <input type="date" value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''} onChange={e => setSelectedDate(new Date(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Hora</label>
                  <input type="time" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Motivo</label>
                <textarea value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" rows={2} placeholder="Ej: Evaluación inicial" />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faSave} /> Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Modal de Acción para Turnos Pendientes (UX Mejorada) */}
      {actionModalOpen && selectedTurno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                Turno Pendiente de Confirmación
              </h2>
              <button onClick={() => setActionModalOpen(false)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Paciente</p>
                <p className="text-lg font-semibold text-white">{selectedTurno.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Fecha y Hora</p>
                <p className="text-white">
                  {new Date(selectedTurno.start).toLocaleDateString('es-AR')} a las {' '}
                  {new Date(selectedTurno.start).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                </p>
              </div>
              {selectedTurno.motivo && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Motivo</p>
                  <p className="text-slate-300 text-sm">{selectedTurno.motivo}</p>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-400 mb-6 text-center flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faInfoCircle} />
              Al confirmar o cancelar, se enviará un correo electrónico automático al paciente y al profesional.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={handleCancelTurno}
                disabled={isActionLoading}
                className="flex-1 px-4 py-3 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faTimes} /> Cancelar
              </button>
              <button 
                onClick={handleConfirmTurno}
                disabled={isActionLoading}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isActionLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><FontAwesomeIcon icon={faCheckCircle} /> Confirmar y Notificar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .fc-theme-dark {
          --fc-page-bg-color: #0f172a; --fc-border-color: #334155; --fc-neutral-bg-color: #1e293b;
          --fc-neutral-text-color: #cbd5e1; --fc-button-text-color: #cbd5e1; --fc-button-bg-color: #1e293b;
          --fc-button-border-color: #334155; --fc-button-hover-bg-color: #334155; --fc-button-active-bg-color: #0ea5e9;
          --fc-event-bg-color: #0ea5e9; --fc-event-border-color: #0284c7; --fc-event-text-color: #ffffff;
          --fc-today-bg-color: rgba(14, 165, 233, 0.1);
        }
        .fc-theme-dark .fc-col-header-cell-cushion, .fc-theme-dark .fc-timegrid-axis-cushion { color: #94a3b8; }
        .fc-theme-dark .fc-toolbar-title { color: #f8fafc; }
      `}</style>
    </div>
  );
}