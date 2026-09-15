'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaBox,
  FaUsers,
  FaShoppingCart,
  FaTruck,
  FaFileInvoice,
  FaChartLine,
  FaWallet,
  FaHistory,
  FaTags
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────
// 🔹 Módulos disponibles (Fácilmente escalable)
// ─────────────────────────────────────────────────────────────
const modules = [

  {
    id: 'Usuarios',
    title: 'Gestión de Usuarioss',
    description: 'Usuarios del sistema.',
    icon: <FaUsers className="text-2xl text-zinc-400" />,
    href: '/admin',
  },



];

export default function GestionPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Estado para controlar si ya se validó el rol
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // 🔒 Validación estricta de autenticación y rol
  useEffect(() => {
    const validateAccess = async () => {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        router.push('/login');
        setIsAuthorized(false);
        return;
      }

      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        setIsAuthorized(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const allowedRoles = ['admin',];

        if (!allowedRoles.includes(payload.role)) {
          router.push('/');
          setIsAuthorized(false);
          return;
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error('Token inválido', err);
        router.push('/login');
        setIsAuthorized(false);
      }
    };

    validateAccess();
  }, [status, session, router, pathname]);

  // ✅ Loader de seguridad
  if (status === 'loading' || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-zinc-800 border-t-zinc-400 mx-auto mb-4"></div>
          <p className="text-zinc-500 text-sm tracking-wide">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // ✅ Si no está autorizado, no mostrar nada (ya se redirigió)
  if (!isAuthorized) {
    return null;
  }

  // ✅ Renderizado principal
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">

      {/* Header */}
      <header className="mb-10 mt-40 max-w-6xl mx-auto text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
          <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-semibold">
            Panel Operativo
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
          Centro de Gestión
        </h1>
        <p className="text-zinc-500 mt-2 text-sm md:text-base">
          Accedé a los módulos de tu distribuidora en un solo lugar.
        </p>
      </header>

      {/* Grid de Módulos */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="group block"
            >
              <div className="h-full bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 transition-all duration-300 hover:bg-zinc-900/80 hover:border-zinc-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-zinc-800/80 rounded-lg group-hover:bg-zinc-700 transition-colors duration-300 flex-shrink-0">
                    {module.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-200 mb-1.5 group-hover:text-white transition-colors">
                      {module.title}
                    </h2>
                    <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors">
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}