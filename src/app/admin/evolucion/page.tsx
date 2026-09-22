'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaChartLine, FaArrowLeft, FaNotesMedical, FaRulerCombined, FaBullseye } from 'react-icons/fa';

export default function EvolucionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/evolucion');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col">
      {/* Botón para volver */}
      <button 
        onClick={() => router.push('/admin')} 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-8 group w-fit"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
        Volver al Panel Principal
      </button>

      {/* Contenido Central */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full">
        
        {/* Icono animado con efecto de brillo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative bg-slate-900 border border-slate-700 w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl shadow-sky-900/20">
            <FaChartLine className="w-12 h-12 text-sky-400" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Módulo en Desarrollo
        </h1>
        <p className="text-slate-400 text-lg mb-10 max-w-xl">
          Estamos construyendo la sección de <span className="text-sky-400 font-semibold">Evolución y Métricas</span> para potenciar el seguimiento clínico de tus pacientes.
        </p>

        {/* Tarjetas de características próximas (Generan expectativa) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col items-center text-center hover:border-sky-500/30 transition-colors">
            <FaNotesMedical className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Gráficos EVA</h3>
            <p className="text-sm text-slate-400">Seguimiento visual del nivel de dolor a lo largo del tiempo.</p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col items-center text-center hover:border-sky-500/30 transition-colors">
            <FaRulerCombined className="w-8 h-8 text-amber-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Rango de Movimiento</h3>
            <p className="text-sm text-slate-400">Registro y comparación de grados de movilidad articular.</p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col items-center text-center hover:border-sky-500/30 transition-colors">
            <FaBullseye className="w-8 h-8 text-rose-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Objetivos Clínicos</h3>
            <p className="text-sm text-slate-400">Medición del progreso y cumplimiento de metas de rehabilitación.</p>
          </div>
        </div>

        {/* Botón de acción principal */}
        <button 
          onClick={() => router.push('/gestion')}
          className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-900/20 hover:shadow-sky-500/20 hover:-translate-y-0.5 flex items-center gap-2"
        >
          <FaArrowLeft /> Volver al Dashboard
        </button>
        
        <p className="text-xs text-slate-600 mt-6">
          Versión 1.0 • Próxima actualización en breve
        </p>
      </div>
    </div>
  );
}