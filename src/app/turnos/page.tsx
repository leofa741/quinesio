// app/turnos/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TurnosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Seguridad: Si no está logueado o no es paciente, mandarlo al login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/turnos');
    } else if (status === 'authenticated' && session?.user?.role !== 'pacientes') {
      // Si un admin intenta entrar aquí por error, lo mandamos a su panel
      router.push('/gestion');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Reservar Turno</h1>
      <p className="text-slate-400">Aquí irá el formulario para que el paciente elija especialidad, profesional y horario.</p>
      
      {/* Aquí irán los componentes del formulario de turnos */}
    </div>
  );
}