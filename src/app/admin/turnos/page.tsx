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
import { 
  faCalendarPlus, faClock, faTimes, faSave, faCheckCircle, faInfoCircle, 
  faFileMedical, faTrash, faUserPlus, faSearch, faSpinner, faUserMd, 
  faNotesMedical, faImage, faChartLine, faPlusCircle
} from '@fortawesome/free-solid-svg-icons';

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

const FileUpload = ({ label, file, preview, onChange, onRemove }: any) => (
  <div className="space-y-2">
    <label className="block text-sm text-slate-400 font-medium">{label}</label>
    {preview ? (
      <div className="relative group">
        <img src={preview} alt={label} className="w-full h-32 object-cover rounded-lg border border-slate-700 bg-slate-800" />
        <button type="button" onClick={onRemove} className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-lg" title="Eliminar imagen">
          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 hover:border-sky-500/50 transition">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <FontAwesomeIcon icon={faImage} className="w-8 h-8 text-slate-500 mb-2" />
          <p className="text-xs text-slate-400 text-center px-2">Click para subir<br/>(Opcional)</p>
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({ pacienteId: '', pacienteNombre: '', motivo: '', hora: '09:00', duracion: 60 });

  const [turnoFiles, setTurnoFiles] = useState({ orden: null as File | null, dniFrente: null as File | null, dniDorso: null as File | null });
  const [turnoPreviews, setTurnoPreviews] = useState({ orden: '', dniFrente: '', dniDorso: '' });

  const [pacientesList, setPacientesList] = useState<Paciente[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', lastName: '', email: '', phone: '' });
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // ✅ NUEVOS ESTADOS PARA MÚLTIPLES PLANES
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | 'new' | null>(null);
  const [sessionStep, setSessionStep] = useState<'select' | 'form'>('select');
  const [isCheckingPlans, setIsCheckingPlans] = useState(false);

  const [detailFiles, setDetailFiles] = useState({ orden: null as File | null, dniFrente: null as File | null, dniDorso: null as File | null });
  const [detailPreviews, setDetailPreviews] = useState({ orden: '', dniFrente: '', dniDorso: '' });
  const [detailDelete, setDetailDelete] = useState({ orden: false, dniFrente: false, dniDorso: false });

  const [showClinicalForm, setShowClinicalForm] = useState(false);
  const [clinicalFormData, setClinicalFormData] = useState({
    diagnostico: '', objetivo: '', totalSesiones: 10, dolorEva: 5,
    tecnicasAplicadas: '', evolucion: '', proximosPasos: ''
  });
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?callbackUrl=/admin/turnos'); return; }
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
    } catch (error) { toast.error('Error al cargar profesionales'); }
    finally { setIsInitialLoading(false); }
  };

  const fetchEvents = async (startStr: string, endStr: string) => {
    if (!selectedProf) return;
    try {
      const res = await fetch(`/api/turnos?profesionalId=${selectedProf}&start=${startStr}&end=${endStr}`);
      const data = await res.json();
      if (data.success) setEvents(data.eventos);
    } catch (error) { console.error('Error al cargar la agenda:', error); }
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
    if (searchTerm.length < 2) { setPacientesList([]); setIsSearching(false); return; }
    setIsSearching(true);
    try {
      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`/api/pacientes?search=${encodeURIComponent(searchTerm)}&limit=15`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      }); 
      if (res.ok) { const data = await res.json(); setPacientesList(data.pacientes || []); }
      else { setPacientesList([]); }
    } catch (error) { console.error('Error cargando pacientes:', error); setPacientesList([]); }
    finally { setIsSearching(false); }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchPacientesList(value), 400);
  };

  const handleTurnoFileChange = (type: 'orden' | 'dniFrente' | 'dniDorso', file: File | null) => {
    setTurnoFiles(prev => ({ ...prev, [type]: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTurnoPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      reader.readAsDataURL(file);
    } else { setTurnoPreviews(prev => ({ ...prev, [type]: '' })); }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPatient(true);
    try {
      const token = session?.user?.token || localStorage.getItem('token');
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newPatient.name, lastName: newPatient.lastName, email: newPatient.email, phone: newPatient.phone, role: 'pacientes', activo: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Paciente creado exitosamente');
        setFormData({ ...formData, pacienteId: data._id, pacienteNombre: `${data.name} ${data.lastName}` });
        setShowCreatePatient(false);
        setNewPatient({ name: '', lastName: '', email: '', phone: '' });
        setSearchQuery('');
        setPacientesList([]);
      } else { toast.error(data.error || 'Error al crear paciente'); }
    } catch (error) { toast.error('Error de conexión al crear paciente'); }
    finally { setIsCreatingPatient(false); }
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    setFormData(prev => ({ ...prev, hora: selectInfo.startStr.split('T')[1].substring(0, 5) }));
    handleOpenNewTurno();
  };

  const handleEventClick = async (info: any) => {
    const turno = {
      id: info.event.id, title: info.event.title, estado: info.event.extendedProps.estado,
      motivo: info.event.extendedProps.motivo, notasInternas: info.event.extendedProps.notasInternas || '',
      pacienteId: info.event.extendedProps.pacienteId, profesionalId: info.event.extendedProps.profesionalId,
      ordenMedicaUrl: info.event.extendedProps.ordenMedicaUrl || '', dniFrenteUrl: info.event.extendedProps.dniFrenteUrl || '',
      dniDorsoUrl: info.event.extendedProps.dniDorsoUrl || '', start: info.event.start, end: info.event.end,
    };
    setSelectedTurno(turno);
    setDetailFiles({ orden: null, dniFrente: null, dniDorso: null });
    setDetailPreviews({ orden: '', dniFrente: '', dniDorso: '' });
    setDetailDelete({ orden: false, dniFrente: false, dniDorso: false });
    setActivePlans([]);
    setSelectedPlanId(null);
    setSessionStep('select');
    setShowClinicalForm(false);
    
    if (turno.estado === 'pendiente') {
      setActionModalOpen(true);
    } else {
      setDetailModalOpen(true);
      if (turno.pacienteId && (turno.profesionalId || selectedProf)) {
        setIsCheckingPlans(true);
        try {
          const res = await fetch(`/api/planes?pacienteId=${turno.pacienteId}&profesionalId=${turno.profesionalId || selectedProf}`);
          const data = await res.json();
          if (data.success) setActivePlans(data.planes || []);
        } catch (error) { console.error("Error checking plans", error); }
        finally { setIsCheckingPlans(false); }
      }
    }
  };

  const handleUpdateTurnoDetails = async () => {
    if (!selectedTurno) return;
    setIsSavingNotes(true);
    try {
      const formData = new FormData();
      formData.append('notasInternas', selectedTurno.notasInternas || '');
      if (detailFiles.orden) formData.append('ordenMedica', detailFiles.orden);
      if (detailFiles.dniFrente) formData.append('dniFrente', detailFiles.dniFrente);
      if (detailFiles.dniDorso) formData.append('dniDorso', detailFiles.dniDorso);
      if (detailDelete.orden) formData.append('deleteOrden', 'true');
      if (detailDelete.dniFrente) formData.append('deleteDniFrente', 'true');
      if (detailDelete.dniDorso) formData.append('deleteDniDorso', 'true');

      const res = await fetch(`/api/turnos?id=${selectedTurno.id}`, { method: 'PATCH', body: formData });
      if (res.ok) {
        toast.success('📝 Turno y documentación actualizados correctamente');
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
        setDetailModalOpen(false);
      } else { toast.error('Error al actualizar el turno'); }
    } catch (error) { toast.error('Error de conexión'); }
    finally { setIsSavingNotes(false); }
  };

  const handleConfirmTurno = async () => {
    if (!selectedTurno) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/turnos?id=${selectedTurno.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'confirmado' })
      });
      if (res.ok) {
        toast.success('✅ Turno confirmado y paciente notificado');
        setActionModalOpen(false);
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
      } else { toast.error('Error al confirmar el turno'); }
    } catch (error) { toast.error('Error de conexión'); }
    finally { setIsActionLoading(false); }
  };

  const handleCancelTurno = async () => {
    if (!selectedTurno) return;
    const result = await Swal.fire({
      title: '¿Cancelar este turno?', text: 'Se enviará una notificación automática de cancelación al paciente.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, cancelar turno', cancelButtonText: 'No, mantener',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', background: '#0f172a', color: '#f1f5f9',
      customClass: { popup: 'border border-slate-700 rounded-xl' }
    });
    if (!result.isConfirmed) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/turnos?id=${selectedTurno.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelado', motivoCancelacion: 'Cancelado desde la agenda' })
      });
      if (res.ok) {
        toast.success('❌ Turno cancelado y paciente notificado');
        setActionModalOpen(false); setDetailModalOpen(false);
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
      } else { toast.error('Error al cancelar el turno'); }
    } catch (error) { toast.error('Error de conexión'); }
    finally { setIsActionLoading(false); }
  };

  const handleSubmitTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.pacienteId || !formData.pacienteNombre) { toast.error('Selecciona o crea un paciente primero'); return; }
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
      } else { toast.error(data.message || 'Error al crear el turno'); }
    } catch (error) { toast.error('Error de conexión'); }
  };

  const handleRegisterSession = async () => {
    if (!selectedTurno || !selectedPlanId) return;
    setIsSubmittingSession(true);
    try {
      let planId = selectedPlanId;

      if (selectedPlanId === 'new') {
        if (!clinicalFormData.diagnostico || !clinicalFormData.totalSesiones) {
          toast.error('Debes completar el diagnóstico y total de sesiones');
          setIsSubmittingSession(false); return;
        }
        const planRes = await fetch('/api/planes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pacienteId: selectedTurno.pacienteId, profesionalId: selectedTurno.profesionalId || selectedProf,
            diagnostico: clinicalFormData.diagnostico, objetivo: clinicalFormData.objetivo,
            totalSesiones: Number(clinicalFormData.totalSesiones)
          })
        });
        const planData = await planRes.json();
        if (planRes.ok) { planId = planData.plan._id; }
        else { toast.error(planData.message || 'Error al crear el plan'); setIsSubmittingSession(false); return; }
      }

      const sessionRes = await fetch('/api/sesiones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTratamientoId: planId, pacienteId: selectedTurno.pacienteId,
          profesionalId: selectedTurno.profesionalId || selectedProf, turnoId: selectedTurno.id,
          dolorEva: Number(clinicalFormData.dolorEva), tecnicasAplicadas: clinicalFormData.tecnicasAplicadas,
          evolucion: clinicalFormData.evolucion, proximosPasos: clinicalFormData.proximosPasos
        })
      });

      const sessionData = await sessionRes.json();
      if (sessionRes.ok) {
        toast.success('✅ Sesión registrada exitosamente');
        setShowClinicalForm(false); setDetailModalOpen(false);
        setSelectedPlanId(null); setSessionStep('select');
        setClinicalFormData({ diagnostico: '', objetivo: '', totalSesiones: 10, dolorEva: 5, tecnicasAplicadas: '', evolucion: '', proximosPasos: '' });
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString());
      } else { toast.error(sessionData.message || 'Error al registrar la sesión'); }
    } catch (error) { toast.error('Error de conexión al registrar la sesión'); }
    finally { setIsSubmittingSession(false); }
  };

  const getDetailPreview = (type: 'orden' | 'dniFrente' | 'dniDorso', url: string) => {
    if (detailPreviews[type]) return detailPreviews[type];
    if (url && !detailDelete[type]) return url;
    return '';
  };

  const handleDetailFileChange = (type: 'orden' | 'dniFrente' | 'dniDorso', file: File | null) => {
    setDetailFiles(prev => ({ ...prev, [type]: file }));
    setDetailDelete(prev => ({ ...prev, [type]: false }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDetailPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      reader.readAsDataURL(file);
    } else { setDetailPreviews(prev => ({ ...prev, [type]: '' })); }
  };

  const handleRemoveExistingDetailImage = (type: 'orden' | 'dniFrente' | 'dniDorso') => {
    setDetailDelete(prev => ({ ...prev, [type]: true }));
    setDetailFiles(prev => ({ ...prev, [type]: null }));
    setDetailPreviews(prev => ({ ...prev, [type]: '' }));
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'completado': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'cancelado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  useEffect(() => { return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); }; }, []);

  if (status === 'loading' || isInitialLoading) {
    return (<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" /></div>);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mt-40 mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faClock} className="text-sky-500" /> Agenda de Turnos
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gestiona la disponibilidad, recepciona y confirma reservas.</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg w-full lg:w-auto min-w-[320px]">
            <label className="flex items-center gap-2 text-sm font-semibold text-sky-400 mb-2">
              <FontAwesomeIcon icon={faUserMd} /> 1. Selecciona un Profesional
            </label>
            <div className="relative">
              <select value={selectedProf} onChange={(e) => { setSelectedProf(e.target.value); const calendarApi = calendarRef.current?.getApi(); if (calendarApi) fetchEvents(calendarApi.view.currentStart.toISOString(), calendarApi.view.currentEnd.toISOString()); }}
                className="w-full appearance-none px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all cursor-pointer font-medium pr-10">
                {profesionales.length === 0 ? (<option value="">Cargando profesionales...</option>) : profesionales.map(p => (<option key={p._id} value={p._id}>{p.name} {p.lastName}</option>))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
              <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5 flex-shrink-0" />
              <span>El calendario se actualizará automáticamente con los turnos de este profesional.</span>
            </p>
          </div>
          <button onClick={handleOpenNewTurno} className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-900/20 hover:shadow-sky-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 lg:self-center">
            <FontAwesomeIcon icon={faCalendarPlus} /> <span>Nuevo Turno</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 w-fit">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pendiente</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Confirmado</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Completado</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Cancelado</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl fc-theme-dark">
          <FullCalendar ref={calendarRef} plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} initialView="timeGridWeek"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' }} locale="es"
            slotMinTime="08:00:00" slotMaxTime="20:00:00" allDaySlot={false} selectable={true} select={handleDateSelect} events={events}
            datesSet={(dateInfo) => fetchEvents(dateInfo.start.toISOString(), dateInfo.end.toISOString())} eventClick={handleEventClick} height="auto" />
        </div>
      </div>

      {/* 1. MODAL DE CREACIÓN DE TURNO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Agendar Nuevo Turno</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><FontAwesomeIcon icon={faTimes} className="w-5 h-5" /></button>
            </div>
            {!showCreatePatient ? (
              <form onSubmit={handleSubmitTurno} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Buscar Paciente</label>
                      <div className="relative">
                        <FontAwesomeIcon icon={isSearching ? faSpinner : faSearch} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSearching ? 'text-sky-500 animate-spin' : 'text-slate-500'}`} />
                        <input type="text" value={searchQuery} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" placeholder="Escribe nombre, apellido o teléfono..." autoFocus />
                      </div>
                      <div className="mt-2 max-h-48 overflow-y-auto border border-slate-700 rounded-lg bg-slate-800/50">
                        {isSearching ? (<div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Buscando...</div>) : searchQuery.length < 2 ? (<div className="p-4 text-center text-sm text-slate-500">Escribe al menos 2 caracteres para buscar</div>) : pacientesList.length > 0 ? (
                          pacientesList.map((p) => (<button key={p._id} type="button" onClick={() => { setFormData({ ...formData, pacienteId: p._id, pacienteNombre: `${p.name} ${p.lastName}` }); setSearchQuery(''); setPacientesList([]); }}
                            className={`w-full text-left px-4 py-3 hover:bg-sky-600/20 transition flex justify-between items-center border-b border-slate-700/50 last:border-0 ${formData.pacienteId === p._id ? 'bg-sky-600/30 text-sky-400' : 'text-slate-300'}`}>
                            <div><span className="font-medium">{p.name} {p.lastName}</span>{p.email && <span className="block text-xs text-slate-500">{p.email}</span>}</div>
                            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">{p.phone || 'Sin tel.'}</span>
                          </button>))
                        ) : (<div className="p-4 text-center text-sm text-slate-500">No se encontraron pacientes con "{searchQuery}"</div>)}
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
                      <div><label className="block text-sm text-slate-400 mb-1">Fecha</label><input type="date" value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''} onChange={e => setSelectedDate(new Date(e.target.value))} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" required /></div>
                      <div><label className="block text-sm text-slate-400 mb-1">Hora</label><input type="time" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" required /></div>
                    </div>
                    <div><label className="block text-sm text-slate-400 mb-1">Motivo</label><textarea value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" rows={2} placeholder="Ej: Evaluación inicial" /></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><FontAwesomeIcon icon={faImage} className="text-sky-500" /> Documentación Adjunta (Opcional)</h3>
                    <FileUpload label="Orden Médica" file={turnoFiles.orden} preview={turnoPreviews.orden} onChange={(file: File | null) => handleTurnoFileChange('orden', file)} onRemove={() => handleTurnoFileChange('orden', null)} />
                    <div className="grid grid-cols-2 gap-3">
                      <FileUpload label="DNI Frente" file={turnoFiles.dniFrente} preview={turnoPreviews.dniFrente} onChange={(file: File | null) => handleTurnoFileChange('dniFrente', file)} onRemove={() => handleTurnoFileChange('dniFrente', null)} />
                      <FileUpload label="DNI Dorso" file={turnoFiles.dniDorso} preview={turnoPreviews.dniDorso} onChange={(file: File | null) => handleTurnoFileChange('dniDorso', file)} onRemove={() => handleTurnoFileChange('dniDorso', null)} />
                    </div>
                  </div>
                </div>
                <div className="pt-2 flex gap-3 border-t border-slate-800 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">Cancelar</button>
                  <button type="submit" disabled={!formData.pacienteId} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"><FontAwesomeIcon icon={faSave} /> Confirmar</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FontAwesomeIcon icon={faUserPlus} className="text-sky-500" /> Nuevo Paciente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Nombre *" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                  <input required placeholder="Apellido *" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                </div>
                <input required type="email" placeholder="Correo electrónico *" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                <input required type="tel" placeholder="Teléfono *" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowCreatePatient(false)} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">Volver</button>
                  <button type="submit" disabled={isCreatingPatient} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">{isCreatingPatient ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Creando...</> : <><FontAwesomeIcon icon={faSave} /> Crear y Seleccionar</>}</button>
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
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span> Turno Pendiente</h2>
              <button onClick={() => setActionModalOpen(false)} className="text-slate-400 hover:text-white"><FontAwesomeIcon icon={faTimes} className="w-5 h-5" /></button>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
              <p className="text-lg font-semibold text-white">{selectedTurno.title}</p>
              <p className="text-white">{new Date(selectedTurno.start).toLocaleDateString('es-AR')} a las {new Date(selectedTurno.start).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</p>
              {selectedTurno.motivo && <p className="text-slate-300 text-sm">Motivo: {selectedTurno.motivo}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleCancelTurno()} disabled={isActionLoading} className="flex-1 px-4 py-3 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition font-medium disabled:opacity-50">Cancelar Turno</button>
              <button onClick={handleConfirmTurno} disabled={isActionLoading} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50">Confirmar y Notificar</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL DE DETALLE MEJORADO */}
      {detailModalOpen && selectedTurno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {!showClinicalForm ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><FontAwesomeIcon icon={faFileMedical} className="text-sky-500" /> Ficha del Turno</h2>
                  <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white"><FontAwesomeIcon icon={faTimes} className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-start">
                    <p className="text-xl font-semibold text-white">{selectedTurno.title}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getEstadoBadge(selectedTurno.estado)}`}>{selectedTurno.estado}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl">
                    <div><p className="text-xs text-slate-400 uppercase tracking-wider">Fecha</p><p className="text-white font-medium">{new Date(selectedTurno.start).toLocaleDateString('es-AR')}</p></div>
                    <div><p className="text-xs text-slate-400 uppercase tracking-wider">Horario</p><p className="text-white font-medium">{new Date(selectedTurno.start).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedTurno.end).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</p></div>
                  </div>
                  {selectedTurno.motivo && (<div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Motivo de Consulta</p><p className="text-slate-300 bg-slate-800/30 p-3 rounded-lg text-sm">{selectedTurno.motivo}</p></div>)}
                  <div className="border-t border-slate-800 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FontAwesomeIcon icon={faImage} className="text-sky-500" /> Documentación Adjunta</h3>
                    <div className="space-y-4">
                      <FileUpload label="Orden Médica" file={detailFiles.orden} preview={getDetailPreview('orden', selectedTurno.ordenMedicaUrl)} onChange={(file: File | null) => handleDetailFileChange('orden', file)} onRemove={() => { if (selectedTurno.ordenMedicaUrl && !detailFiles.orden) handleRemoveExistingDetailImage('orden'); else handleDetailFileChange('orden', null); }} />
                      <div className="grid grid-cols-2 gap-3">
                        <FileUpload label="DNI Frente" file={detailFiles.dniFrente} preview={getDetailPreview('dniFrente', selectedTurno.dniFrenteUrl)} onChange={(file: File | null) => handleDetailFileChange('dniFrente', file)} onRemove={() => { if (selectedTurno.dniFrenteUrl && !detailFiles.dniFrente) handleRemoveExistingDetailImage('dniFrente'); else handleDetailFileChange('dniFrente', null); }} />
                        <FileUpload label="DNI Dorso" file={detailFiles.dniDorso} preview={getDetailPreview('dniDorso', selectedTurno.dniDorsoUrl)} onChange={(file: File | null) => handleDetailFileChange('dniDorso', file)} onRemove={() => { if (selectedTurno.dniDorsoUrl && !detailFiles.dniDorso) handleRemoveExistingDetailImage('dniDorso'); else handleDetailFileChange('dniDorso', null); }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2"><FontAwesomeIcon icon={faInfoCircle} className="text-amber-500" /> Notas Internas</p>
                    <textarea value={selectedTurno.notasInternas} onChange={(e) => setSelectedTurno({ ...selectedTurno, notasInternas: e.target.value })} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none text-sm" rows={3} placeholder="Ej: Paciente debe traer estudios previos..." />
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
                  {selectedTurno.estado !== 'cancelado' && selectedTurno.estado !== 'completado' && (
                    <button onClick={() => handleCancelTurno()} disabled={isActionLoading} className="px-4 py-2.5 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faTrash} /> Cancelar Turno
                    </button>
                  )}
                  <button onClick={handleUpdateTurnoDetails} disabled={isSavingNotes} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSavingNotes ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FontAwesomeIcon icon={faSave} /> Guardar Cambios</>}
                  </button>
                  {(selectedTurno.estado === 'confirmado' || selectedTurno.estado === 'pendiente') && (
                    <button onClick={() => { setShowClinicalForm(true); setSessionStep('select'); }}
                      className="px-4 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30">
                      <FontAwesomeIcon icon={faNotesMedical} className="text-lg" /> Registrar Sesión Clínica
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* FORMULARIO DE REGISTRO DE SESIÓN CLÍNICA CON SELECCIÓN DE PLAN */
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FontAwesomeIcon icon={faNotesMedical} className="text-sky-500" /> 
                    {sessionStep === 'select' ? 'Seleccionar Plan de Tratamiento' : (selectedPlanId === 'new' ? 'Iniciar Nuevo Plan' : 'Registrar Sesión')}
                  </h2>
                  <button onClick={() => { setShowClinicalForm(false); setSessionStep('select'); setSelectedPlanId(null); }} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
                    <FontAwesomeIcon icon={faTimes} /> Cerrar
                  </button>
                </div>

                {sessionStep === 'select' ? (
                  <div className="space-y-4">
                    <p className="text-slate-300">Este paciente tiene <strong>{activePlans.length}</strong> plan(es) de tratamiento activo(s) con este profesional. ¿A cuál pertenece esta sesión?</p>
                    
                    {isCheckingPlans ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Verificando planes...
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activePlans.map((plan) => (
                          <button key={plan._id} onClick={() => { setSelectedPlanId(plan._id); setSessionStep('form'); }}
                            className="w-full text-left p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-sky-500 hover:bg-slate-800/80 transition flex items-center justify-between group">
                            <div>
                              <p className="font-semibold text-white group-hover:text-sky-400 transition">{plan.diagnostico}</p>
                              <p className="text-xs text-slate-400 mt-1">Objetivo: {plan.objetivo || 'No especificado'}</p>
                            </div>
                            <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-xs font-bold rounded-full border border-sky-500/30">
                              {plan.sesionesCompletadas} / {plan.totalSesiones}
                            </span>
                          </button>
                        ))}
                        
                        <button onClick={() => { setSelectedPlanId('new'); setSessionStep('form'); }}
                          className="w-full text-left p-4 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl hover:border-sky-500 hover:bg-sky-500/5 transition flex items-center gap-3 text-slate-400 hover:text-sky-400">
                          <FontAwesomeIcon icon={faPlusCircle} className="w-5 h-5" />
                          <span className="font-medium">Iniciar un nuevo plan de tratamiento (para nuevo síntoma)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleRegisterSession(); }} className="space-y-4">
                    {selectedPlanId === 'new' && (
                      <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-sky-400">1. Datos del Nuevo Plan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input required placeholder="Diagnóstico (Ej: Dolor de cadera) *" value={clinicalFormData.diagnostico} onChange={e => setClinicalFormData({...clinicalFormData, diagnostico: e.target.value})} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                          <input type="number" min="1" required placeholder="Total de Sesiones *" value={clinicalFormData.totalSesiones} onChange={e => setClinicalFormData({...clinicalFormData, totalSesiones: Number(e.target.value)})} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                        </div>
                        <input placeholder="Objetivo del tratamiento (Opcional)" value={clinicalFormData.objetivo} onChange={e => setClinicalFormData({...clinicalFormData, objetivo: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-sky-400">{selectedPlanId === 'new' ? '2. Registro de la Primera Sesión' : 'Registro de la Sesión de Hoy'}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Nivel de Dolor (EVA 0-10)</label>
                          <input type="number" min="0" max="10" value={clinicalFormData.dolorEva} onChange={e => setClinicalFormData({...clinicalFormData, dolorEva: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Técnicas Aplicadas *</label>
                        <textarea required value={clinicalFormData.tecnicasAplicadas} onChange={e => setClinicalFormData({...clinicalFormData, tecnicasAplicadas: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" rows={2} placeholder="Ej: Electroterapia 10min, Ejercicios..." />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Evolución y Notas Clínicas *</label>
                        <textarea required value={clinicalFormData.evolucion} onChange={e => setClinicalFormData({...clinicalFormData, evolucion: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" rows={3} placeholder="Describe la respuesta del paciente..." />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Próximos Pasos / Tareas</label>
                        <textarea value={clinicalFormData.proximosPasos} onChange={e => setClinicalFormData({...clinicalFormData, proximosPasos: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" rows={2} placeholder="Ej: Continuar con ejercicios en casa..." />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                      <button type="button" onClick={() => setSessionStep('select')} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">
                        ← Volver a seleccionar
                      </button>
                      <button type="submit" disabled={isSubmittingSession} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                        {isSubmittingSession ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheckCircle} />}
                        Guardar Sesión
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
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