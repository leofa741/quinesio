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
import { faCalendarPlus, faClock, faTimes, faSave, faCheckCircle, faInfoCircle, faFileMedical, faTrash, faUserPlus, faSearch, faSpinner, faImage } from '@fortawesome/free-solid-svg-icons';

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

// Componente reutilizable para carga de imágenes con preview
const FileUpload = ({ label, file, preview, onChange, onRemove }: any) => (
  <div className="space-y-2">
    <label className="block text-sm text-slate-400 font-medium">{label}</label>
    {preview ? (
      <div className="relative group">
        <img src={preview} alt={label} className="w-full h-32 object-cover rounded-lg border border-slate-700 bg-slate-800" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-lg"
          title="Eliminar imagen"
        >
          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 hover:border-sky-500/50 transition">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <FontAwesomeIcon icon={faImage} className="w-8 h-8 text-slate-500 mb-2" />
          <p className="text-xs text-slate-400">Click para subir imagen</p>
        </div>
        <input type="file" className="hidden" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
    )}
  </div>
);

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

  // Estados para archivos del turno
  const [turnoFiles, setTurnoFiles] = useState({ orden: null, dniFrente: null, dniDorso: null });
  const [turnoPreviews, setTurnoPreviews] = useState({ orden: '', dniFrente: '', dniDorso: '' });

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

  // Estados para archivos en edición
  const [editFiles, setEditFiles] = useState({ orden: null, dniFrente: null, dniDorso: null });
  const [editPreviews, setEditPreviews] = useState({ orden: '', dniFrente: '', dniDorso: '' });

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
    setPacientesList([]);
    setIsSearching(false);
    setTurnoFiles({ orden: null, dniFrente: null, dniDorso: null });
    setTurnoPreviews({ orden: '', dniFrente: '', dniDorso: '' });
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
      console.error('Error cargando pacientes:', error);
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

  const handleFileChange = (type: 'orden' | 'dniFrente' | 'dniDorso', file: File | null, isEdit = false) => {
    if (isEdit) {
      setEditFiles(prev => ({ ...prev, [type]: file }));
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setEditPreviews(prev => ({ ...prev, [type]: reader.result as string }));
        reader.readAsDataURL(file);
      } else {
        setEditPreviews(prev => ({ ...prev, [type]: '' }));
      }
    } else {
      setTurnoFiles(prev => ({ ...prev, [type]: file }));
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setTurnoPreviews(prev => ({ ...prev, [type]: reader.result as string }));
        reader.readAsDataURL(file);
      } else {
        setTurnoPreviews(prev => ({ ...prev, [type]: '' }));
      }
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPatient(true);
    try {
      const token = session?.user?.token || localStorage.getItem('token');
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newPatient, role: 'pacientes', activo: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Paciente creado exitosamente');
        setFormData({ ...formData, pacienteId: data._id, pacienteNombre: `${data.name} ${data.lastName}` });
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
      ordenMedicaUrl: info.event.extendedProps.ordenMedicaUrl || '',
      dniFrenteUrl: info.event.extendedProps.dniFrenteUrl || '',
      dniDorsoUrl: info.event.extendedProps.dniDorsoUrl || '',
      start: info.event.start,
      end: info.event.end,
    };
    setSelectedTurno(turno);
    setEditPreviews({
      orden: turno.ordenMedicaUrl,
      dniFrente: turno.dniFrenteUrl,
      dniDorso: turno.dniDorsoUrl
    });
    setEditFiles({ orden: null, dniFrente: null, dniDorso: null });
    
    if (turno.estado === 'pendiente') {
      setActionModalOpen(true);
    } else {
      setDetailModalOpen(true);
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

    const formDataToSend = new FormData();
    formDataToSend.append('pacienteId', formData.pacienteId);
    formDataToSend.append('profesionalId', selectedProf);
    formDataToSend.append('fechaInicio', fechaInicio.toISOString());
    formDataToSend.append('fechaFin', fechaFin.toISOString());
    formDataToSend.append('duracionMinutos', formData.duracion.toString());
    formDataToSend.append('motivoConsulta', formData.motivo);

    if (turnoFiles.orden) formDataToSend.append('ordenMedica', turnoFiles.orden);
    if (turnoFiles.dniFrente) formDataToSend.append('dniFrente', turnoFiles.dniFrente);
    if (turnoFiles.dniDorso) formDataToSend.append('dniDorso', turnoFiles.dniDorso);

    try {
      const res = await fetch('/api/turnos', { method: 'POST', body: formDataToSend });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Turno creado y notificaciones enviadas');
        setIsModalOpen(false);
        setFormData({ pacienteId: '', pacienteNombre: '', motivo: '', hora: '09:00', duracion: 60 });
        setTurnoFiles({ orden: null, dniFrente: null, dniDorso: null });
        setTurnoPreviews({ orden: '', dniFrente: '', dniDorso: '' });
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
      } else {
        toast.error(data.message || 'Error al crear el turno');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleUpdateTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurno) return;
    setIsSavingNotes(true);

    const formDataToSend = new FormData();
    formDataToSend.append('notasInternas', selectedTurno.notasInternas);
    
    if (editFiles.orden) formDataToSend.append('ordenMedica', editFiles.orden);
    if (editFiles.dniFrente) formDataToSend.append('dniFrente', editFiles.dniFrente);
    if (editFiles.dniDorso) formDataToSend.append('dniDorso', editFiles.dniDorso);

    // Marcar para borrar si se removió la preview y no hay nuevo archivo
    if (!editPreviews.orden && !editFiles.orden && selectedTurno.ordenMedicaUrl) formDataToSend.append('deleteOrden', 'true');
    if (!editPreviews.dniFrente && !editFiles.dniFrente && selectedTurno.dniFrenteUrl) formDataToSend.append('deleteDniFrente', 'true');
    if (!editPreviews.dniDorso && !editFiles.dniDorso && selectedTurno.dniDorsoUrl) formDataToSend.append('deleteDniDorso', 'true');

    try {
      const res = await fetch(`/api/turnos?id=${selectedTurno.id}`, { method: 'PATCH', body: formDataToSend });
      if (res.ok) {
        toast.success('📝 Turno actualizado correctamente');
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
        setDetailModalOpen(false);
      } else {
        toast.error('Error al actualizar el turno');
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

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'completado': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'cancelado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
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
              onClick={handleOpenNewTurno}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCalendarPlus} /> Nuevo Turno
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pendiente</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Confirmado</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Completado</span>
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

      {/* 1. MODAL DE CREACIÓN DE TURNO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Agendar Nuevo Turno</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            {!showCreatePatient ? (
              <form onSubmit={handleSubmitTurno} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna Izquierda: Datos del Turno */}
                  <div className="space-y-4">
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
                      <div className="mt-2 max-h-40 overflow-y-auto border border-slate-700 rounded-lg bg-slate-800/50">
                        {isSearching ? (
                          <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Buscando...
                          </div>
                        ) : searchQuery.length < 2 ? (
                          <div className="p-4 text-center text-sm text-slate-500">Escribe al menos 2 caracteres</div>
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
                              className={`w-full text-left px-4 py-2 hover:bg-sky-600/20 transition flex justify-between items-center border-b border-slate-700/50 last:border-0 ${formData.pacienteId === p._id ? 'bg-sky-600/30 text-sky-400' : 'text-slate-300'}`}
                            >
                              <span>{p.name} {p.lastName}</span>
                              <span className="text-xs text-slate-500">{p.phone || 'Sin tel.'}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-slate-500">No se encontraron pacientes</div>
                        )}
                      </div>
                    </div>

                    {formData.pacienteId && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-emerald-200 truncate">Paciente: <strong>{formData.pacienteNombre}</strong></span>
                        </div>
                        <button type="button" onClick={() => { setFormData({ ...formData, pacienteId: '', pacienteNombre: '' }); setSearchQuery(''); setPacientesList([]); }} className="flex-shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition" title="Cambiar paciente">
                          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <button type="button" onClick={() => setShowCreatePatient(true)} className="w-full py-2.5 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-sky-500 hover:bg-sky-500/10 rounded-lg text-sm transition flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faUserPlus} /> ¿No está en la lista? Crear paciente nuevo
                    </button>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                        <input type="date" value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''} onChange={e => setSelectedDate(new Date(e.target.value))} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" required />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Hora</label>
                        <input type="time" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Motivo</label>
                      <textarea value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" rows={2} placeholder="Ej: Evaluación inicial" />
                    </div>
                  </div>

                  {/* Columna Derecha: Carga de Imágenes */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <FontAwesomeIcon icon={faFileMedical} className="text-sky-500" /> Documentación Adjunta (Opcional)
                    </h3>
                    <FileUpload 
                      label="Orden Médica" 
                      file={turnoFiles.orden} 
                      preview={turnoPreviews.orden} 
                      onChange={(file: File | null) => handleFileChange('orden', file)} 
                      onRemove={() => handleFileChange('orden', null)} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FileUpload 
                        label="DNI Frente" 
                        file={turnoFiles.dniFrente} 
                        preview={turnoPreviews.dniFrente} 
                        onChange={(file: File | null) => handleFileChange('dniFrente', file)} 
                        onRemove={() => handleFileChange('dniFrente', null)} 
                      />
                      <FileUpload 
                        label="DNI Dorso" 
                        file={turnoFiles.dniDorso} 
                        preview={turnoPreviews.dniDorso} 
                        onChange={(file: File | null) => handleFileChange('dniDorso', file)} 
                        onRemove={() => handleFileChange('dniDorso', null)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">Cancelar</button>
                  <button type="submit" disabled={!formData.pacienteId} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faSave} /> Confirmar y Guardar
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

      {/* 3. MODAL DE DETALLE (FICHA DE TURNO CON IMÁGENES) */}
      {detailModalOpen && selectedTurno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faFileMedical} className="text-sky-500" /> Ficha del Turno
              </h2>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTurno} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna Izquierda: Datos y Notas */}
                <div className="space-y-4">
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
                      rows={4}
                      placeholder="Ej: Paciente debe traer estudios previos..."
                    />
                  </div>
                </div>

                {/* Columna Derecha: Imágenes */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <FontAwesomeIcon icon={faImage} className="text-sky-500" /> Documentación Adjunta
                  </h3>
                  <FileUpload 
                    label="Orden Médica" 
                    file={editFiles.orden} 
                    preview={editPreviews.orden} 
                    onChange={(file: File | null) => handleFileChange('orden', file, true)} 
                    onRemove={() => handleFileChange('orden', null, true)} 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FileUpload 
                      label="DNI Frente" 
                      file={editFiles.dniFrente} 
                      preview={editPreviews.dniFrente} 
                      onChange={(file: File | null) => handleFileChange('dniFrente', file, true)} 
                      onRemove={() => handleFileChange('dniFrente', null, true)} 
                    />
                    <FileUpload 
                      label="DNI Dorso" 
                      file={editFiles.dniDorso} 
                      preview={editPreviews.dniDorso} 
                      onChange={(file: File | null) => handleFileChange('dniDorso', file, true)} 
                      onRemove={() => handleFileChange('dniDorso', null, true)} 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                {selectedTurno.estado !== 'cancelado' && selectedTurno.estado !== 'completado' && (
                  <button type="button" onClick={() => handleCancelTurno(true)} disabled={isActionLoading} className="px-4 py-2.5 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition font-medium disabled:opacity-50 flex items-center gap-2">
                    <FontAwesomeIcon icon={faTrash} /> Cancelar Turno
                  </button>
                )}
                <button type="submit" disabled={isSavingNotes} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSavingNotes ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FontAwesomeIcon icon={faSave} /> Guardar Cambios</>}
                </button>
              </div>
            </form>
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