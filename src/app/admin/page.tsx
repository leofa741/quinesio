// app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUsers, faUser } from '@fortawesome/free-solid-svg-icons';

interface User {
  _id: string;
  name: string;
  lastName: string;
  address: string;
  city: string;
  zipCode: string;
  email: string;
  phone: string;
  role: 'admin' | 'superadmin' | 'vendedor' | 'user' | string;
  img?: string;
  token?: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const validateAndFetch = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') {
        router.push('/');
        return;
      }

      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) {
        toast.error('Acceso denegado');
        router.push('/');
        return;
      }

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin') {
          toast.error('Acceso restringido a administradores');
          router.push('/');
          return;
        }

        await fetchUsers(token);
        setIsAuthorized(true);
      } catch (err) {
        console.error('Error al validar sesión:', err);
        toast.error('Sesión inválida');
        router.push('/');
      }
    };

    validateAndFetch();
  }, [session, status, router]);

  const fetchUsers = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        throw new Error('Error al cargar los usuarios');
      }
    } catch (error) {
      console.error('Error al cargar los usuarios:', error);
      toast.error('Hubo un error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const token = session?.user?.token || localStorage.getItem('token');

    if (!token) {
      toast.error('Sesión expirada');
      router.push('/login');
      return;
    }

    if (userId === session?.user?.id) {
      toast.error('No puedes eliminar tu propia cuenta.');
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará el usuario de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f1f5f9',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#475569',
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al eliminar el usuario');

      toast.success('Usuario eliminado con éxito');
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      toast.error('Hubo un error al eliminar el usuario');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-40" style={{ filter: 'blur(150px)' }} />
        </div>
        <div className="relative z-10 flex items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // 🔹 SEPARAR USUARIOS POR ROL
  const adminRoles = ['admin', 'superadmin', 'vendedor'];
  const usuariosAdmin = users.filter(u => adminRoles.includes(u.role));
  const usuariosFinales = users.filter(u => u.role === 'user');

  const cardClasses = "border border-slate-700/50 rounded-xl shadow-lg p-4 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-colors";
  const tableHeaderClasses = "p-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-800/50";
  const tableCellClasses = "p-4 text-sm text-slate-300 border-t border-slate-700/50";

  // 🔹 Componente reutilizable para tabla de usuarios
  const UsersTable = ({ usersList, title, icon, emptyMessage }: {
    usersList: User[];
    title: string;
    icon: React.ReactNode;
    emptyMessage: string;
  }) => (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-violet-400 border border-violet-500/30">
          {icon}
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
          {usersList.length}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {usersList.length === 0 ? (
          <div className={cardClasses}>
            <p className="text-slate-400 text-center py-6">{emptyMessage}</p>
          </div>
        ) : (
          usersList.map(user => (
            <UserCard key={user._id} user={user} onDelete={handleDeleteUser} />
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        {usersList.length === 0 ? (
          <div className={cardClasses}>
            <p className="text-slate-400 text-center py-6">{emptyMessage}</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Foto</th>
                <th className={tableHeaderClasses}>Nombre</th>
                <th className={tableHeaderClasses}>Apellido</th>
                <th className={tableHeaderClasses}>Ciudad</th>
                <th className={tableHeaderClasses}>Teléfono</th>
                <th className={tableHeaderClasses}>Correo</th>
                <th className={tableHeaderClasses}>Rol</th>
                <th className={tableHeaderClasses}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(user => (
                <tr key={user._id} className="hover:bg-slate-700/30 transition-colors">
                  <td className={tableCellClasses}>
                    {user.img ? (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-slate-600/50">
                        <Image src={user.img} alt={`Avatar de ${user.name}`} fill sizes="2.25rem" style={{ objectFit: 'cover' }} className="bg-slate-700" />
                      </div>
                    ) : <span className="text-slate-500 text-xs">—</span>}
                  </td>
                  <td className={tableCellClasses}>{user.name}</td>
                  <td className={tableCellClasses}>{user.lastName}</td>
                  <td className={tableCellClasses}>{user.city || '—'}</td>
                  <td className={tableCellClasses}>{user.phone || '—'}</td>
                  <td className={`${tableCellClasses} break-all max-w-[180px]`}>{user.email}</td>
                  <td className={tableCellClasses}>
                    <RoleBadge role={user.role} />
                  </td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2">
                      <Link href={`/admin/edit-user/${user._id}`} className="bg-amber-600/90 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-[0.98]">Editar</Link>
                      <button onClick={() => handleDeleteUser(user._id)} className="bg-rose-600/90 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-[0.98]">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // 🔹 Componente Card para móvil
  const UserCard = ({ user, onDelete }: { user: User; onDelete: (id: string) => void }) => (
    <div className={cardClasses}>
      <div className="flex items-start gap-4">
        {user.img ? (
          <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-slate-600/50 flex-shrink-0">
            <Image src={user.img} alt={`Avatar de ${user.name}`} fill sizes="3.5rem" style={{ objectFit: 'cover' }} className="bg-slate-700" />
          </div>
        ) : (
          <div className="w-14 h-14 bg-slate-700/50 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-600/50">
            <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-slate-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{user.name} {user.lastName}</p>
          <p className="text-sm text-violet-400 truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <RoleBadge role={user.role} inline />
            {user.city && <span className="text-xs text-slate-500">• {user.city}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
        <Link href={`/admin/edit-user/${user._id}`} className="flex-1 bg-amber-600/90 hover:bg-amber-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium text-center transition active:scale-[0.98]">Editar</Link>
        <button onClick={() => onDelete(user._id)} className="flex-1 bg-rose-600/90 hover:bg-rose-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition active:scale-[0.98]">Eliminar</button>
      </div>
    </div>
  );

  // 🔹 Badge de rol con colores
  const RoleBadge = ({ role, inline = false }: { role: string; inline?: boolean }) => {
    const styles: Record<string, string> = {
      admin: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      superadmin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      vendedor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      user: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
    };
    const base = inline ? 'px-2 py-0.5' : 'px-2.5 py-1 rounded-full text-xs';
    return (
      <span className={`${base} border font-medium capitalize`}>
        <span className={styles[role] || styles.user}>{role}</span>
      </span>
    );
  };

  return (
    // ✅ KEY FIX: min-h-screen + bg-slate-950 + background ambiental
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">

      <br/><br/><br/><br/>
      
      {/* ✨ Background ambiental - MISMO patrón que el resto del sitio */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-40" style={{ filter: 'blur(150px)' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" aria-hidden="true" />
      </div>

      {/* 🔹 Contenido con z-10 y padding responsivo */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-[env(safe-area-inset-bottom)]">
        
        {/* 🏷️ Header optimizado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pt-4 sm:pt-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/30">
                <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
              </span>
              Administrar Usuarios
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-xl">
              Gestioná el equipo interno y los usuarios finales de la plataforma.
            </p>
          </div>
          <Link 
            href="/gestion" 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:text-white transition-all duration-300 active:scale-[0.98] shadow-lg shadow-slate-900/20"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" /> 
            <span className="hidden sm:inline">Volver a Gestión</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-lg">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg">No hay usuarios registrados.</p>
            <Link href="/admin/create-user" className="mt-4 inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition active:scale-[0.98]">
              + Crear primer usuario
            </Link>
          </div>
        ) : (
          <>
            {/* 🔹 Sección 1: Equipo Interno */}
            <UsersTable
              usersList={usuariosAdmin}
              title="Equipo Interno"
              icon={<FontAwesomeIcon icon={faUsers} className="w-5 h-5" />}
              emptyMessage="No hay usuarios con roles administrativos."
            />

            {/* 🔹 Separador visual */}
            <div className="my-8 border-t border-slate-700/50" />

            {/* 🔹 Sección 2: Usuarios Finales */}
            <UsersTable
              usersList={usuariosFinales}
              title="Usuarios Finales"
              icon={<FontAwesomeIcon icon={faUser} className="w-5 h-5" />}
              emptyMessage="No hay usuarios finales registrados."
            />
          </>
        )}
      </div>
    </div>
  );
}