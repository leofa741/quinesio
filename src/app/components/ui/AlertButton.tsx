// app/components/ui/AlertButton.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaBell, FaBellSlash, FaSpinner } from 'react-icons/fa6';

interface AlertButtonProps {
  propiedadId: string;
  propiedadTitulo: string;
  onAlertCreated?: () => void;
}

export default function AlertButton({ propiedadId, propiedadTitulo, onAlertCreated }: AlertButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alertaActiva, setAlertaActiva] = useState(false);

  const handleClick = async () => {
    // Si no está logueado, redirigir a login con returnTo
    if (status === 'unauthenticated') {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
      toast.info('🔐 Iniciá sesión para guardar alertas');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch('/api/alertas', {
        method: alertaActiva ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'propiedad',
          propiedadId,
          frecuencia: 'inmediato'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAlertaActiva(!alertaActiva);
        toast.success(
          alertaActiva 
            ? '🔕 Alerta cancelada' 
            : `🔔 Te avisaremos si hay cambios en "${propiedadTitulo}"`
        );
        onAlertCreated?.();
      } else {
        toast.error(data.error || 'Error al gestionar la alerta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Tooltip con estado
  const tooltip = alertaActiva 
    ? 'Tenés una alerta activa para esta propiedad' 
    : 'Recibí notificaciones si cambia el precio o estado';

  return (
    <button
      onClick={handleClick}
      disabled={loading || status === 'loading'}
      title={tooltip}
      className={`
        group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
        transition-all duration-200 cursor-pointer  -mt-10 z-10000 -mr-10
        ${alertaActiva 
          ? 'bg-violet-600/20 text-violet-400 border border-violet-500/40 hover:bg-violet-600/30' 
          : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700/60 hover:text-white hover:border-violet-500/40'
        }
        disabled:opacity-60 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <FaSpinner className="w-4 h-4 animate-spin" />
      ) : alertaActiva ? (
        <FaBellSlash className="w-4 h-4" />
      ) : (
        <FaBell className="w-4 h-4 group-hover:scale-110 transition-transform" />
      )}
      
      <span className="hidden sm:inline">
        {loading ? 'Procesando...' : alertaActiva ? 'Alerta activa' : 'Avisarme'}
      </span>
      
      {/* Badge de frecuencia */}
      {alertaActiva && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}