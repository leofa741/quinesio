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
  FaTags,
  FaCog,
  FaFileExcel,
  FaChartBar,
  FaHospital,
  FaMoneyBillWave,
  FaNotesMedical,
  FaCalendarAlt,
  FaUserMd,
  FaUserInjured,
  FaUserClock,
  FaCashRegister,
  FaDumbbell,
  FaFilePrescription,
  FaBell
} from 'react-icons/fa';
import { UserRole } from '../lib/auth';
import { isPatientRole, isStaffRole } from '../lib/auth-utils';
import { FaUserDoctor } from 'react-icons/fa6';

// ─────────────────────────────────────────────────────────────
// 🔹 Módulos disponibles (Fácilmente escalable)
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// 🔹 Módulos del Panel de Administración
// ─────────────────────────────────────────────────────────────
const modules = [
  {
    id: 'usuarios',
    title: 'Gestión de Usuarios',
    description: 'Administrar roles, permisos y acceso del personal del sistema.',
    icon: <FaUsers className="text-2xl text-zinc-400" />,
    href: '/admin',
    roles: ['admin'], // Solo admin puede gestionar usuarios
  },
  {
    id: 'pacientes',
    title: 'Gestión de Pacientes',
    description: 'Datos personales, obra social, diagnóstico e historial clínico.',
    icon: <FaUserInjured className="text-2xl text-zinc-400" />,
    href: '/gestion/pacientes',
    roles: ['admin', 'profesionales', 'administrativos'],
  },
  {
    id: 'profesionales',
    title: 'Profesionales',
    description: 'Gestiona tu perfil profesional, especialidades, horarios y honorarios.',
    icon: <FaUserDoctor className="text-2xl text-zinc-400" />,
    href: '/admin/profesionales',
    roles: ['admin', 'profesionales', 'administrativos'], // ✅ Perfecto
  },
  {
    id: 'turnos',
    title: 'Agenda de Turnos',
    description: 'Reservar, modificar y gestionar turnos por profesional y fecha.',
    icon: <FaCalendarAlt className="text-2xl text-zinc-400" />,
    href: '/admin/turnos',
    roles: ['admin', 'profesionales', 'administrativos'],
  },
  {
    id: 'sesiones',
    title: 'Registro de Sesiones',
    description: 'Notas clínicas, evolución del paciente y técnicas aplicadas.',
    icon: <FaNotesMedical className="text-2xl text-zinc-400" />,
    href: '/admin/sesiones',
    roles: ['admin', 'profesionales'],
  },
  {
    id: 'lista-espera',
    title: 'Lista de Espera',
    description: 'Alertas y solicitudes de turnos de pacientes.',
    icon: <FaUserClock className="text-2xl text-zinc-400" />, // Asegúrate de importar FaUserClock
    href: '/admin/lista-espera',
    roles: ['admin', 'administrativos'], // ✅ Solo estos dos roles
  },
  {
    id: 'obras-sociales',
    title: 'Obras Sociales',
    description: 'Configurar prestadoras, planes y códigos de cobertura.',
    icon: <FaHospital className="text-2xl text-zinc-400" />,
    href: '/admin/obras-sociales',
    roles: ['admin', 'administrativos'],
  },
  {
    id: 'pagos',
    title: 'Gestión de Pagos',
    description: 'Registrar pagos, métodos y calcular deudas por paciente, calcular honorarios por profesional.',
    icon: <FaMoneyBillWave className="text-2xl text-zinc-400" />,
    href: '/admin/pagos',
    roles: ['admin', 'administrativos'],
  },

  {
    id: 'reportes',
    title: 'Reportes y Estadísticas',
    description: 'Turnos por profesional, ingresos, sesiones restantes y más.',
    icon: <FaChartBar className="text-2xl text-zinc-400" />,
    href: '/admin/reportes',
    roles: ['admin', 'administrativos'],
  },
  {
    id: 'ejercicios',
    title: 'Planes de Ejercicios',
    description: 'Asigna rutinas domiciliarias con videos y realiza seguimiento de cumplimiento.',
    icon: <FaDumbbell className="text-2xl text-zinc-400" />, // o FaRunning
    href: '/admin/ejercicios',
    roles: ['admin', 'profesionales'],
  },
  {
    id: 'prescripciones',
    title: 'Prescripciones Kinesiológicas',
    description: 'Emití prescripciones de tratamiento con código de verificación único.',
    icon: <FaFilePrescription className="text-2xl text-zinc-400" />,
    href: '/admin/prescripciones',
    roles: ['admin', 'profesionales'],
  },
  {
    id: 'recordatorios',
    title: 'Recordatorios de Turnos',
    description: 'Envía recordatorios automáticos por email a los pacientes antes de sus turnos.',
    icon: <FaBell className="text-2xl text-zinc-400" />,
    href: '/admin/recordatorios',
    roles: ['admin', 'administrativos'], // ✅ Ideal para el personal que gestiona la agenda
  },
  {
    id: 'historial-turnos',
    title: 'Historial de Turnos',
    description: 'Consulta y filtra el historial completo de turnos con estadísticas.',
    icon: <FaHistory className="text-2xl text-zinc-400" />,
    href: '/admin/historial-turnos',
    roles: ['admin', 'profesionales', 'administrativos'],
  },
  {
    id: 'bitacora',
    title: 'Bitacota de ingresos al sistema',
    description: 'Bitacota de ingresos al sistema .',
    icon: <FaCog className="text-2xl text-zinc-400" />,
    href: '/gestion/logs',
    roles: ['admin'],
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
      // Esperar a que NextAuth termine de cargar
      if (status === 'loading') return;

      // 🔹 Si no está autenticado, ir al login
      if (status === 'unauthenticated') {
        router.push('/login');
        setIsAuthorized(false);
        return;
      }

      // 🔹 Obtener token (de sesión o localStorage como fallback)
      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        setIsAuthorized(false);
        return;
      }

      try {
        // 🔹 Decodificar payload del JWT (sin verificar firma, solo leer datos)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload?.role as UserRole | undefined;

        // 🔹 Validar rol con helpers reutilizables
        if (!isStaffRole(role)) {
          // Pacientes van a /turnos, roles desconocidos van a /
          const redirectPath = isPatientRole(role) ? '/turnos' : '/';
          console.log(`🔐 Acceso denegado para role "${role}" → redirigiendo a ${redirectPath}`);
          router.push(redirectPath);
          setIsAuthorized(false);
          return;
        }

        // ✅ Acceso autorizado
        console.log(`✅ Acceso concedido para role "${role}"`);
        setIsAuthorized(true);

      } catch (err) {
        console.error('❌ Token inválido o malformado:', err);
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