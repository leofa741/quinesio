'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUserMd, faSearch, faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Profesional {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  img?: string;
  matricula?: string;
  especialidades: string[];
  descripcionProfesional?: string;
  horariosAtencion: string[];
  honorarios?: { valorSesion?: number; valorEvaluacion?: number; duracionSesion?: number; moneda?: string };
  activo: boolean;
}

export default function GestionProfesionalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/profesionales');
      return;
    }
    if (status === 'authenticated') {
      fetchProfesionales();
    }
  }, [status, router]);

  const fetchProfesionales = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/profesionales');
      const data = await res.json();
      if (data.success) {
        setProfesionales(data.profesionales);
      } else {
        toast.error(data.message || 'Error al cargar');
      }
    } catch (error) {
      toast.error('Error de conexión al cargar profesionales');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar profesional?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      background: '#0f172a',
      color: '#f1f5f9'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/profesionales?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profesional eliminado');
        setProfesionales(prev => prev.filter(p => p._id !== id));
      } else {
        toast.error(data.message || 'Error al eliminar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const formatPrice = (price?: number, currency: string = 'ARS') => {
    if (!price) return 'Consultar';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(price);
  };

  const profesionalesFiltrados = profesionales.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.lastName.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.especialidades?.some(esp => esp.toLowerCase().includes(query))
    );
  });

  const canManage = session?.user?.role === 'admin' || session?.user?.role === 'administrativos';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mt-35 mb-8">
        <Link href="/gestion" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-4 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Volver al Panel
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faUserMd} className="text-sky-500" />
              Gestión de Profesionales
            </h1>
            <p className="text-slate-400 text-sm mt-1">Administra terapeutas, especialidades, horarios y honorarios.</p>
          </div>
          {canManage && (
            <Link 
              href="/admin/profesionales/nuevo" 
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center gap-2 justify-center shadow-lg shadow-sky-900/20"
            >
              <FontAwesomeIcon icon={faPlus} /> Nuevo Profesional
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profesionalesFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            No se encontraron profesionales con ese criterio.
          </div>
        ) : (
          profesionalesFiltrados.map((prof) => (
            <div key={prof._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-sky-500/30 transition-all group flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                  {prof.img ? (
                    <Image src={prof.img} alt={prof.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <FontAwesomeIcon icon={faUserMd} className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{prof.name} {prof.lastName}</h3>
                  <p className="text-xs text-sky-400 font-medium mb-1">{prof.matricula || 'Sin matrícula'}</p>
                  <p className="text-xs text-slate-500 truncate">{prof.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {prof.especialidades?.length > 0 ? (
                  prof.especialidades.map((esp, idx) => (
                    <span key={idx} className="px-2 py-1 bg-sky-500/10 text-sky-400 text-xs rounded-md border border-sky-500/20">
                      {esp}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-600 italic">Sin especialidades</span>
                )}
              </div>

              {prof.honorarios?.valorSesion && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Honorarios</p>
                  <p className="text-sm font-semibold text-white">
                    Sesión ({prof.honorarios.duracionSesion} min): {formatPrice(prof.honorarios.valorSesion, prof.honorarios.moneda)}
                  </p>
                  {prof.honorarios.valorEvaluacion && (
                    <p className="text-xs text-slate-400 mt-1">
                      Evaluación: {formatPrice(prof.honorarios.valorEvaluacion, prof.honorarios.moneda)}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-auto flex gap-2 pt-4 border-t border-slate-800">
                <Link 
                  href={`/admin/profesionales/${prof._id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
                >
                  <FontAwesomeIcon icon={faEdit} /> Editar
                </Link>
                {canManage && (
                  <button 
                    onClick={() => handleDelete(prof._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm transition"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}