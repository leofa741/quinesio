'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faUserMd, faArrowLeft, faClock, faCheckCircle, faImage, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Profesional {
  _id: string;
  name: string;
  lastName: string;
  especialidades: string[];
  honorarios?: { valorSesion?: number; moneda?: string; duracionSesion?: number };
  tiempoPreparacionMinutos?: number;
}

// Componente reutilizable para carga de imágenes
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
          <p className="text-xs text-slate-400 text-center px-2">Click para subir imagen<br/>(Opcional)</p>
        </div>
        <input type="file" className="hidden" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
    )}
  </div>
);

export default function ReservarTurnoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [selectedProf, setSelectedProf] = useState<Profesional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [motivo, setMotivo] = useState('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [files, setFiles] = useState({ ordenMedica: null as File | null, dniFrente: null as File | null, dniDorso: null as File | null });
  const [previews, setPreviews] = useState({ ordenMedica: '', dniFrente: '', dniDorso: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/turnos/reservar');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/admin/profesionales')
        .then(res => res.json())
        .then(data => { if (data.success) setProfesionales(data.profesionales); });
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (selectedProf && selectedDate) {
        setLoadingSlots(true);
        setSelectedTime('');
        try {
          const res = await fetch(`/api/turnos/disponibilidad?profesionalId=${selectedProf._id}&fecha=${selectedDate}`);
          const data = await res.json();
          if (data.success) {
            setAvailableSlots(data.slots);
          }
        } catch (error) {
          console.error('Error cargando horarios:', error);
          toast.error('No se pudieron cargar los horarios disponibles.');
        } finally {
          setLoadingSlots(false);
        }
      }
    };
    fetchDisponibilidad();
  }, [selectedProf, selectedDate]);

  const handleFileChange = (type: 'ordenMedica' | 'dniFrente' | 'dniDorso', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      reader.readAsDataURL(file);
    } else {
      setPreviews(prev => ({ ...prev, [type]: '' }));
    }
  };

  const handleReservar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !selectedProf || !selectedDate || !selectedTime) {
      toast.error('Faltan datos para completar la reserva');
      return;
    }
    setIsSubmitting(true);

    // ✅ CORRECCIÓN DE ZONA HORARIA:
    // Parseamos manualmente para evitar que JavaScript interprete "YYYY-MM-DD" como UTC
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    // Creamos la fecha en la zona horaria local del navegador del usuario
    const fechaInicio = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    const fechaFin = new Date(fechaInicio);
    const duracion = selectedProf.honorarios?.duracionSesion || 60;
    const prep = selectedProf.tiempoPreparacionMinutos || 0;
    fechaFin.setMinutes(fechaFin.getMinutes() + duracion + prep);

    const formData = new FormData();
    formData.append('pacienteId', session.user.id);
    formData.append('profesionalId', selectedProf._id); // ✅ ID explícito y seguro del profesional seleccionado
    formData.append('fechaInicio', fechaInicio.toISOString());
    formData.append('fechaFin', fechaFin.toISOString());
    formData.append('duracionMinutos', duracion.toString());
    formData.append('motivoConsulta', motivo);
    
    if (files.ordenMedica) formData.append('ordenMedica', files.ordenMedica);
    if (files.dniFrente) formData.append('dniFrente', files.dniFrente);
    if (files.dniDorso) formData.append('dniDorso', files.dniDorso);

    try {
      const res = await fetch('/api/turnos', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ ¡Solicitud enviada! Te llegará un correo de confirmación.');
        router.push('/turnos/mis-turnos');
      } else {
        toast.error(data.message || 'Ese horario ya no está disponible.');
      }
    } catch (error) {
      toast.error('Error de conexión al reservar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" /></div>;
  }

  const baseSlots = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mt-40 mx-auto">
        <button onClick={() => router.push('/profile')} className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-6 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Volver a mi perfil
        </button>

        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-sky-400' : 'text-slate-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s ? 'border-sky-500 bg-sky-500/20' : 'border-slate-700'}`}>
                {step > s ? <FontAwesomeIcon icon={faCheckCircle} /> : s}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{s === 1 ? 'Profesional' : s === 2 ? 'Fecha y Hora' : 'Confirmar'}</span>
            </div>
          ))}
        </div>

        {/* PASO 1: Elegir Profesional */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Elige a tu profesional</h2>
            <div className="grid gap-4">
              {profesionales.map(prof => (
                <button key={prof._id} onClick={() => { setSelectedProf(prof); setStep(2); }}
                  className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-sky-500/50 hover:bg-slate-800/50 transition-all text-left w-full group">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-sky-400">
                    <FontAwesomeIcon icon={faUserMd} className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">{prof.name} {prof.lastName}</h3>
                    <p className="text-sky-400 text-sm">{prof.especialidades?.join(', ') || 'Kinesiología'}</p>
                    {prof.honorarios?.valorSesion && (
                      <p className="text-slate-400 text-xs mt-1">
                        Sesión: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: prof.honorarios.moneda || 'ARS' }).format(prof.honorarios.valorSesion)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: Elegir Fecha y Hora */}
        {step === 2 && selectedProf && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Elige fecha y hora con {selectedProf.name}</h2>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Fecha disponible</label>
              <input type="date" min={new Date().toISOString().split('T')[0]} 
                value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                  Horarios disponibles 
                  {loadingSlots && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sky-500 text-xs" />}
                </label>
                
                {loadingSlots ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {baseSlots.map(time => {
                      const isAvailable = availableSlots.includes(time);
                      return (
                        <button 
                          key={time} 
                          disabled={!isAvailable}
                          onClick={() => isAvailable && setSelectedTime(time)}
                          className={`py-2 rounded-lg border text-sm font-medium transition relative ${
                            selectedTime === time 
                              ? 'bg-sky-600 border-sky-500 text-white' 
                              : isAvailable 
                                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-sky-500/50 hover:text-white' 
                                : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed line-through decoration-slate-600'
                          }`}
                          title={!isAvailable ? 'Horario ocupado' : 'Disponible'}
                        >
                          {time}
                          {!isAvailable && (
                            <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-[10px] border border-red-500/30">
                              <FontAwesomeIcon icon={faTimes} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} /> No hay horarios disponibles para esta fecha. Por favor, selecciona otro día.
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button onClick={() => { setStep(1); setSelectedDate(''); setSelectedTime(''); }} className="flex-1 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition">Atrás</button>
              <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}
                className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition">
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Confirmar */}
        {step === 3 && selectedProf && (
          <form onSubmit={handleReservar} className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Confirma tu reserva</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faUserMd} className="text-sky-500 text-xl" />
                <div>
                  <p className="text-sm text-slate-400">Profesional</p>
                  <p className="font-semibold">{selectedProf.name} {selectedProf.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCalendarCheck} className="text-sky-500 text-xl" />
                <div>
                  <p className="text-sm text-slate-400">Fecha y Hora</p>
                  <p className="font-semibold">
                    {/* ✅ CORRECCIÓN DE VISUALIZACIÓN: Forzamos la interpretación como hora local */}
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR')} a las {selectedTime} hs
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Motivo de la consulta (Opcional)</label>
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none"
                  placeholder="Ej: Dolor de rodilla derecha..." />
              </div>

              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faImage} className="text-sky-500" /> Documentación Adjunta (Opcional)
                </h3>
                <div className="space-y-4">
                  <FileUpload label="Orden Médica" file={files.ordenMedica} preview={previews.ordenMedica} onChange={(file: File | null) => handleFileChange('ordenMedica', file)} onRemove={() => handleFileChange('ordenMedica', null)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileUpload label="DNI Frente" file={files.dniFrente} preview={previews.dniFrente} onChange={(file: File | null) => handleFileChange('dniFrente', file)} onRemove={() => handleFileChange('dniFrente', null)} />
                    <FileUpload label="DNI Dorso" file={files.dniDorso} preview={previews.dniDorso} onChange={(file: File | null) => handleFileChange('dniDorso', file)} onRemove={() => handleFileChange('dniDorso', null)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition">Modificar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-800 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                {isSubmitting ? 'Procesando...' : <><FontAwesomeIcon icon={faCheckCircle} /> Confirmar Reserva</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}