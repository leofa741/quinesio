'use client';

import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaMoneyBillWave, FaTools } from 'react-icons/fa';

export default function PagosPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl mt-40 w-full">
        {/* Botón Volver */}
        <button
          onClick={() => router.push('/gestion')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-8 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
          Volver al panel
        </button>

        {/* Contenido Central */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12 text-center shadow-2xl">
          
          {/* Icono Animado */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-slate-800 border border-slate-700 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <FaMoneyBillWave className="w-10 h-10 text-sky-400" />
              <div className="absolute -bottom-2 -right-2 bg-slate-700 border border-slate-600 rounded-full p-2">
                <FaTools className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Gestión de Pagos
          </h1>
          
          <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
            Estamos trabajando en esta sección. Próximamente podrás registrar pagos, 
            gestionar métodos de cobro y visualizar el estado de cuenta de cada paciente.
          </p>

          {/* Badge de Estado */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-amber-400 text-sm font-semibold tracking-wide uppercase">
              En Desarrollo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}