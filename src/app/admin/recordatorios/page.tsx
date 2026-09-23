'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSpinner, faCheckCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function RecordatoriosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Redirigir si no está logueado
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/admin/recordatorios');
  }

  const enviarRecordatorios = async () => {
    setLoading(true);
    setResultado(null);
    try {
      // ✅ Ya no necesitamos el header, NextAuth envía las cookies automáticamente
      // y la API verificará que session.user.role sea válido.
      const res = await fetch('/api/recordatorios');
      const data = await res.json();
      
      if (data.success) {
        setResultado(data);
        toast.success(`✅ ${data.enviados} recordatorios enviados exitosamente`);
      } else {
        toast.error(data.message || 'Error al procesar los recordatorios');
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-sky-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mt-32 mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-6 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Volver
        </button>

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faBell} className="text-sky-500" />
          Recordatorios de Turnos
        </h1>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <p className="text-slate-300 mb-6">
            Este botón buscará todos los turnos <strong>confirmados</strong> de las próximas 24 horas 
            que aún no hayan recibido un recordatorio, y les enviará un email automático.
          </p>
          
          <button
            onClick={enviarRecordatorios}
            disabled={loading}
            className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Procesando y enviando...</>
            ) : (
              <><FontAwesomeIcon icon={faBell} /> Enviar Recordatorios Ahora</>
            )}
          </button>
        </div>

        {resultado && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
              <FontAwesomeIcon icon={faCheckCircle} /> Resultado del Proceso
            </h2>
            <div className="space-y-3 text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Turnos encontrados:</span>
                <span className="font-bold text-white">{resultado.total}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Emails enviados:</span>
                <span className="font-bold text-emerald-400">{resultado.enviados}</span>
              </div>
              {resultado.errores && resultado.errores.length > 0 && (
                <div className="mt-4">
                  <p className="text-red-400 font-semibold mb-2">Errores encontrados:</p>
                  <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                    {resultado.errores.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}