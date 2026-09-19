'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faUserMd, faArrowLeft, faClock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

interface Profesional {
  _id: string;
  name: string;
  lastName: string;
  especialidades: string[];
  honorarios?: { valorSesion?: number; moneda?: string };
}

export default function ReservarTurnoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [selectedProf, setSelectedProf] = useState<Profesional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [motivo, setMotivo] = useState('');
  const [step, setStep] = useState(1); // 1: Elegir Prof, 2: Fecha/Hora, 3: Confirmar
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleReservar = async () => {
    if (!session?.user?.id || !selectedProf || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);

    const [hours, minutes] = selectedTime.split(':');
    const fechaInicio = new Date(selectedDate);
    fechaInicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + 60); // Duración por defecto 60 min

    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ✅ AQUÍ ESTÁ LA MAGIA: El sistema usa el ID de la sesión automáticamente.
          // El paciente nunca lo ve ni lo escribe.
          pacienteId: session.user.id, 
          profesionalId: selectedProf._id,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          duracionMinutos: 60,
          motivoConsulta: motivo,
        }),
      });

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
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mt-40 mx-auto">
        <button onClick={() => router.push('/profile')} className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-6 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Volver a mi perfil
        </button>

        {/* Stepper de pasos */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-sky-400' : 'text-slate-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s ? 'border-sky-500 bg-sky-500/20' : 'border-slate-700'}`}>
                {step > s ? <FontAwesomeIcon icon={faCheckCircle} /> : s}
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {s === 1 ? 'Profesional' : s === 2 ? 'Fecha y Hora' : 'Confirmar'}
              </span>
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
                <label className="block text-sm text-slate-400 mb-2">Horarios disponibles</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'].map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)}
                      className={`py-2 rounded-lg border text-sm font-medium transition ${
                        selectedTime === time 
                        ? 'bg-sky-600 border-sky-500 text-white' 
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-sky-500/50'
                      }`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition">Atrás</button>
              <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}
                className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition">
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Confirmar */}
        {step === 3 && selectedProf && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Confirma tu reserva</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
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
                  <p className="font-semibold">{new Date(selectedDate).toLocaleDateString('es-AR')} a las {selectedTime} hs</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Motivo de la consulta (Opcional)</label>
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none"
                  placeholder="Ej: Dolor de rodilla derecha..." />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition">Modificar</button>
              <button disabled={isSubmitting} onClick={handleReservar}
                className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-800 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                {isSubmitting ? 'Procesando...' : <><FontAwesomeIcon icon={faCheckCircle} /> Confirmar Reserva</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}