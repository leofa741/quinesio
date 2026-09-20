'use client';

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faClock, faTimes, faSave, faCheckCircle, faInfoCircle, faFileMedical, faTrash, faUserPlus, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Profesional {
  _id: string;
  name: string;
  lastName: string;
}

interface Paciente {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function AgendaTurnosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const calendarRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [selectedProf, setSelectedProf] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Modal de Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    pacienteId: '', pacienteNombre: '', motivo: '', hora: '09:00', duracion: 60,
  });

  // Estados para el buscador y creación rápida de pacientes
  const [pacientesList, setPacientesList] = useState<Paciente[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', lastName: '', email: '', phone: '' });
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  // Modales de Acción y Detalle
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  const handleOpenNewTurno = () => {
    setIsModalOpen(true);
    setShowCreatePatient(false);
    setSearchQuery('');
    setPacientesList([]); // Limpiar lista al abrir
    setIsSearching(false);
  };

  // ✅ BÚSQUEDA OPTIMIZADA: Solo busca si hay 2+ caracteres
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

      const url = `/api/pacientes?search=${encodeURIComponent(searchTerm)}&limit=15`; 

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }); 
      
      if (res.ok) {
        const data = await res.json();
        setPacientesList(data.pacientes || []);
      } else {
        setPacientesList([]);
      }
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      setPacientesList([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ✅ Manejo del input de búsqueda con Debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Nuevo timeout de 400ms
    searchTimeoutRef.current = setTimeout(() => {
      fetchPacientesList(value);
    }, 400);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPatient(true);
    try {
      const token = session?.user?.token || localStorage.getItem('token');

      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPatient.name,
          lastName: newPatient.lastName,
          email: newPatient.email,
          phone: newPatient.phone,
          role: 'pacientes',
          activo: true
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Paciente creado exitosamente');
        setFormData({
          ...formData,
          pacienteId: data._id,
          pacienteNombre: `${data.name} ${data.lastName}`
        });
        setShowCreatePatient(false);
        setNewPatient({ name: '', lastName: '', email: '', phone: '' });
        setSearchQuery('');
        setPacientesList([]);
      } else {
        toast.error(data.error || 'Error al crear paciente');
      }
    } catch (error) {
      toast.error('Error de conexión al crear paciente');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    setFormData(prev => ({ ...prev, hora: selectInfo.startStr.split('T')[1].substring(0, 5) }));
    handleOpenNewTurno();
  };

  const handleEventClick = (info: any) => {
    const turno = {
      id: info.event.id,
      title: info.event.title,
      estado: info.event.extendedProps.estado,
      motivo: info.event.extendedProps.motivo,
      notasInternas: info.event.extendedProps.notasInternas || '',
      start: info.event.start,
      end: info.event.end,
    };
    setSelectedTurno(turno);
    if (turno.estado === 'pendiente') {
      setActionModalOpen(true);
    } else {
      setDetailModalOpen(true);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTurno) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/turnos?id=${selectedTurno.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notasInternas: selectedTurno.notasInternas })
      });
      if (res.ok) {
        toast.success('📝 Notas guardadas correctamente');
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
        setDetailModalOpen(false);
      } else {
        toast.error('Error al guardar las notas');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSavingNotes(false);
    }
  };

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
        toast.success('✅ Turno confirmado y paciente notificado');
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

  const handleCancelTurno = async (fromDetail = false) => {
    if (!selectedTurno) return;

    const result = await Swal.fire({
      title: '¿Cancelar este turno?',
      text: 'Se enviará una notificación automática de cancelación al paciente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar turno',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#0f172a',
      color: '#f1f5f9',
      customClass: { popup: 'border border-slate-700 rounded-xl' }
    });

    if (!result.isConfirmed) return;

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
        setDetailModalOpen(false);
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
      toast.error('Selecciona o crea un paciente primero');
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
        setFormData({ pacienteId: '', pacienteNombre: '', motivo: '', hora: '09:00', duracion: 60 });
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
      } else {
        toast.error(data.message || 'Error al crear el turno');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'completado': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'cancelado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  // Limpieza del timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

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
        {/* ========================================== */}
        {/* HEADER MEJORADO CON UX CLARA               */}
        {/* ========================================== */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faClock} className="text-sky-500" />
              Agenda de Turnos
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gestiona la disponibilidad, recepciona y confirma reservas.</p>
          </div>

          {/* Panel de Control de Profesional (UX Mejorada) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg w-full lg:w-auto min-w-[320px]">
            <label className="flex items-center gap-2 text-sm font-semibold text-sky-400 mb-2">
              <FontAwesomeIcon icon={faUserMd} />
              1. Selecciona un Profesional
            </label>
            
            <div className="relative">
              <select
                value={selectedProf}
                onChange={(e) => {
                  setSelectedProf(e.target.value);
                  const calendarApi = calendarRef.current?.getApi();
                  if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
                }}
                className="w-full appearance-none px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all cursor-pointer font-medium pr-10"
              >
                {profesionales.length === 0 ? (
                  <option value="">Cargando profesionales...</option>
                ) : (
                  profesionales.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.lastName}
                    </option>
                  ))
                )}
              </select>
              {/* Icono de flecha personalizado */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
            
            {/* Texto de ayuda explicativo */}
            <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
              <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5 flex-shrink-0" />
              <span>El calendario se actualizará automáticamente con los turnos de este profesional.</span>
            </p>
          </div>

          {/* Botón de Nuevo Turno */}
          <button
            onClick={handleOpenNewTurno}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-900/20 hover:shadow-sky-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 lg:self-center"
          >
            <FontAwesomeIcon icon={faCalendarPlus} /> 
            <span>Nuevo Turno</span>
          </button>
        </div>

        {/* Leyenda de colores */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 w-fit">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pendiente</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Confirmado</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Completado</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Cancelado</span>
        </div>

        {/* Calendario */}
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

    
      {/* ========================================== */}
      {/* 1. MODAL DE CREACIÓN DE TURNO (UX MEJORADA)*/}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Agendar Nuevo Turno</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            {!showCreatePatient ? (
              <form onSubmit={handleSubmitTurno} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Buscar Paciente</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={isSearching ? faSpinner : faSearch} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSearching ? 'text-sky-500 animate-spin' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                      placeholder="Escribe nombre, apellido o teléfono..."
                      autoFocus
                    />
                  </div>
                  
                  {/* Lista de resultados con estados claros */}
                  <div className="mt-2 max-h-48 overflow-y-auto border border-slate-700 rounded-lg bg-slate-800/50">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Buscando...
                      </div>
                    ) : searchQuery.length < 2 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        Escribe al menos 2 caracteres para buscar
                      </div>
                    ) : pacientesList.length > 0 ? (
                      pacientesList.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, pacienteId: p._id, pacienteNombre: `${p.name} ${p.lastName}` });
                            setSearchQuery('');
                            setPacientesList([]);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-sky-600/20 transition flex justify-between items-center border-b border-slate-700/50 last:border-0 ${formData.pacienteId === p._id ? 'bg-sky-600/30 text-sky-400' : 'text-slate-300'}`}
                        >
                          <div>
                            <span className="font-medium">{p.name} {p.lastName}</span>
                            {p.email && <span className="block text-xs text-slate-500">{p.email}</span>}
                          </div>
                          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">{p.phone || 'Sin tel.'}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No se encontraron pacientes con "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>

                              {formData.pacienteId && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-emerald-200 truncate">
                        Paciente: <strong>{formData.pacienteNombre}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, pacienteId: '', pacienteNombre: '' });
                        setSearchQuery('');
                        setPacientesList([]);
                      }}
                      className="flex-shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition"
                      title="Cambiar paciente"
                    >
                      <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowCreatePatient(true)}
                  className="w-full py-2.5 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-sky-500 hover:bg-sky-500/10 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faUserPlus} /> ¿No está en la lista? Crear paciente nuevo
                </button>

                <div className="grid grid-cols-2 gap-4 pt-2">
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
                  <button type="submit" disabled={!formData.pacienteId} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faSave} /> Confirmar
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserPlus} className="text-sky-500" /> Nuevo Paciente
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Nombre *" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                  <input required placeholder="Apellido *" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                </div>
                <input required type="email" placeholder="Correo electrónico *" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                <input required type="tel" placeholder="Teléfono *" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowCreatePatient(false)} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">Volver</button>
                  <button type="submit" disabled={isCreatingPatient} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                    {isCreatingPatient ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Creando...</> : <><FontAwesomeIcon icon={faSave} /> Crear y Seleccionar</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. MODAL DE ACCIÓN (Solo para PENDIENTES) */}
      {actionModalOpen && selectedTurno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                Turno Pendiente
              </h2>
              <button onClick={() => setActionModalOpen(false)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
              <p className="text-lg font-semibold text-white">{selectedTurno.title}</p>
              <p className="text-white">{new Date(selectedTurno.start).toLocaleDateString('es-AR')} a las {new Date(selectedTurno.start).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</p>
              {selectedTurno.motivo && <p className="text-slate-300 text-sm">Motivo: {selectedTurno.motivo}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleCancelTurno(false)} disabled={isActionLoading} className="flex-1 px-4 py-3 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition font-medium disabled:opacity-50">Cancelar Turno</button>
              <button onClick={handleConfirmTurno} disabled={isActionLoading} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50">Confirmar y Notificar</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL DE DETALLE (FICHA DE TURNO) */}
      {detailModalOpen && selectedTurno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faFileMedical} className="text-sky-500" /> Ficha del Turno
              </h2>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start">
                <p className="text-xl font-semibold text-white">{selectedTurno.title}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getEstadoBadge(selectedTurno.estado)}`}>{selectedTurno.estado}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Fecha</p>
                  <p className="text-white font-medium">{new Date(selectedTurno.start).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Horario</p>
                  <p className="text-white font-medium">
                    {new Date(selectedTurno.start).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(selectedTurno.end).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                  </p>
                </div>
              </div>
              {selectedTurno.motivo && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Motivo de Consulta</p>
                  <p className="text-slate-300 bg-slate-800/30 p-3 rounded-lg text-sm">{selectedTurno.motivo}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-amber-500" /> Notas Internas
                </p>
                <textarea
                  value={selectedTurno.notasInternas}
                  onChange={(e) => setSelectedTurno({ ...selectedTurno, notasInternas: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none text-sm"
                  rows={3}
                  placeholder="Ej: Paciente debe traer estudios previos..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              {selectedTurno.estado !== 'cancelado' && selectedTurno.estado !== 'completado' && (
                <button onClick={() => handleCancelTurno(true)} disabled={isActionLoading} className="px-4 py-2.5 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition font-medium disabled:opacity-50 flex items-center gap-2">
                  <FontAwesomeIcon icon={faTrash} />  Cancelar Turno
                </button>
              )}
              <button onClick={handleSaveNotes} disabled={isSavingNotes} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
                {isSavingNotes ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FontAwesomeIcon icon={faSave} /> Guardar Notas</>}
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