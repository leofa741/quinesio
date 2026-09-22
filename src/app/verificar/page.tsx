'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faFilePrescription, faShieldAlt, faSpinner 
} from '@fortawesome/free-solid-svg-icons';

export default function VerificarPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    
    setLoading(true);
    // Redirigir a la página de resultados
    router.push(`/verificar/${codigo.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex flex-col items-center justify-center p-4">
      <div className="w-full mt-40 max-w-md">
        
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
            <FontAwesomeIcon icon={faShieldAlt} className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Verificación de Prescripciones</h1>
          <p className="text-slate-600">Ingrese el código de verificación del documento</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleVerificar} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Código de Verificación
            </label>
            <div className="relative">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: KIN-DWA8AJWB"
                className="w-full px-4 py-3 pl-12 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 font-mono text-lg tracking-wider focus:border-sky-500 focus:outline-none focus:bg-white transition-all"
                required
              />
              <FontAwesomeIcon 
                icon={faFilePrescription} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" 
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              El código se encuentra en la parte superior de la prescripción
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || codigo.length < 5}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSearch} />
                Verificar Documento
              </>
            )}
          </button>
        </form>

        {/* Info adicional */}
        <div className="mt-6 bg-white/60 backdrop-blur rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-600">
            <strong>¿Qué es esto?</strong><br/>
            Este sistema permite verificar la autenticidad de prescripciones kinesiológicas emitidas digitalmente.
          </p>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Sistema de Gestión Kinesiológica • Verificación Segura v1.0
        </p>
      </div>
    </div>
  );
}