'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUserMd, faTimes, faCheckCircle, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';

interface Turno {
  _id: string;
  profesional: {
    name: string;
    lastName: string;
    especialidades?: string[];
  };
  fechaInicio: string;
  fechaFin: string;
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'completado';
  motivoConsulta?: string;
}

export default function MisTurnosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/turnos/mis-turnos');
      return;
    }
    if (status === 'authenticated') {
      fetchMisTurnos();
    }
  }, [status, router]);

  const fetchMisTurnos = async () => {
    try {
      const res = await fetch('/api/turnos/mis-turnos');
      const data = await res.json();
      if (data.success) {
        setTurnos(data.turnos);
      }
    } catch (error) {
      toast.error('Error al cargar tus turnos');
    } finally {
      setLoading(false);
    }
  };

  const cancelarTurno = async (turnoId: string) => {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;

    try {
      const res = await fetch(`/api/turnos?id=${turnoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estado: 'cancelado',
          motivoCancelacion: 'Cancelado por el paciente'
        }),
      });

      if (res.ok) {
        toast.success('Turno cancelado');
        fetchMisTurnos();
      } else {
        toast.error('Error al cancelar el turno');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      pendiente: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: faHourglassHalf, text: 'Pendiente' },
      confirmado: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: faCheckCircle, text: 'Confirmado' },
      cancelado: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: faTimes, text: 'Cancelado' },
      completado: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: faCheckCircle, text: 'Completado' },
    };
    return estados[estado as keyof typeof estados] || estados.pendiente;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mt-40 mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-sky-500" />
          Mis Turnos
        </h1>

        {turnos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">No tienes turnos agendados</p>
            <button
              onClick={() => router.push('/turnos/reservar')}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition"
            >
              Reservar un turno
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {turnos.map((turno) => {
              const estado = getEstadoBadge(turno.estado);
              const fecha = new Date(turno.fechaInicio);
              
              return (
                <div key={turno._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-sky-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <FontAwesomeIcon icon={faUserMd} className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-white">
                          {turno.profesional.name} {turno.profesional.lastName}
                        </h3>
                        <p className="text-sky-400 text-sm mb-2">
                          {turno.profesional.especialidades?.join(', ') || 'Kinesiología'}
                        </p>
                        {turno.motivoConsulta && (
                          <p className="text-slate-400 text-sm">{turno.motivoConsulta}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estado.color}`}>
                      <FontAwesomeIcon icon={estado.icon} className="w-3 h-3" />
                      {estado.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
                      {fecha.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                      {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </div>
                  </div>

                  {turno.estado === 'pendiente' && (
                    <button
                      onClick={() => cancelarTurno(turno._id)}
                      className="w-full py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition"
                    >
                      Cancelar turno
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}