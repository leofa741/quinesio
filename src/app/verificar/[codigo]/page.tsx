'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, faTimesCircle, faExclamationTriangle, 
  faSpinner, faArrowLeft, faShieldAlt 
} from '@fortawesome/free-solid-svg-icons';

export default function VerificarPrescripcionPage() {
  const params = useParams();
  const router = useRouter();
  const codigo = params?.codigo as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verificar = async () => {
      if (!codigo) return;
      try {
        const res = await fetch(`/api/verificar-prescripcion?codigo=${encodeURIComponent(codigo)}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'Código no encontrado');
        }
      } catch (err) {
        setError('Error de conexión al verificar el documento');
      } finally {
        setLoading(false);
      }
    };
    verificar();
  }, [codigo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <FontAwesomeIcon icon={faSpinner} className="w-10 h-10 animate-spin text-sky-600 mb-4" />
        <p className="text-slate-600 font-medium">Verificando autenticidad del documento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full mt-40 max-w-2xl">
        
        {/* Botón Volver */}
        <button 
          onClick={() => router.push('/verificar')} 
          className="mb-6 inline-flex items-center gap-2 text-slate-500 hover:text-sky-600 transition-colors font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Verificar otro documento
        </button>

        {/* TARJETA PRINCIPAL */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Header según estado */}
          {!error && data?.estado === 'activa' && (
            <div className="bg-emerald-50 border-b border-emerald-100 p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-emerald-800">Documento Auténtico y Válido</h1>
              <p className="text-emerald-600 mt-1">Esta prescripción fue emitida legalmente a través de nuestro sistema.</p>
            </div>
          )}

          {!error && data?.estado === 'vencida' && (
            <div className="bg-amber-50 border-b border-amber-100 p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-amber-800">Documento Vencido</h1>
              <p className="text-amber-700 mt-1">Esta prescripción fue auténtica, pero su período de validez ha expirado.</p>
            </div>
          )}

          {!error && data?.estado === 'anulada' && (
            <div className="bg-red-50 border-b border-red-100 p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faTimesCircle} className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-800">Documento Anulado</h1>
              <p className="text-red-700 mt-1">Esta prescripción fue cancelada por el profesional emisor y ya no es válida.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-b border-red-100 p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faTimesCircle} className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-800">Verificación Fallida</h1>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Contenido del Documento */}
          {!error && data && (
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Código destacado */}
              <div className="flex items-center justify-center gap-2 bg-slate-100 rounded-lg p-3">
                <FontAwesomeIcon icon={faShieldAlt} className="text-slate-500" />
                <span className="text-sm text-slate-600 font-medium">Código verificado:</span>
                <span className="font-mono font-bold text-slate-800 text-lg tracking-wider">{data.codigoVerificacion}</span>
              </div>

              {/* Datos en cuadrícula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paciente</p>
                  <p className="text-lg font-bold text-slate-800">{data.paciente?.name} {data.paciente?.lastName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profesional Emisor</p>
                  <p className="text-lg font-bold text-slate-800">
                    {data.profesional?.name} {data.profesional?.lastName}
                  </p>
                  {data.profesional?.matricula && (
                    <p className="text-sm text-slate-500">Matrícula: {data.profesional.matricula}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha de Emisión</p>
                  <p className="text-base font-medium text-slate-700">{new Date(data.fechaEmision).toLocaleDateString('es-AR')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Válido Hasta</p>
                  <p className={`text-base font-medium ${data.estado === 'vencida' ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                    {new Date(data.fechaVencimiento).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnóstico Kinesiológico</p>
                  <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">{data.diagnostico}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Prescripción de Tratamiento</p>
                  <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">{data.prescripcion}</p>
                </div>
              </div>

              {/* Footer legal */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500">
                  <strong>Nota de validez:</strong> Este documento es una prescripción kinesiológica digital. 
                  No reemplaza recetas médicas. Su autenticidad puede ser verificada en cualquier momento en este sitio web.
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Verificación realizada el {new Date().toLocaleDateString('es-AR')} a las {new Date().toLocaleTimeString('es-AR')}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-6">
          Sistema de Gestión Kinesiológica • Verificación Segura v1.0
        </p>
      </div>
    </div>
  );
}