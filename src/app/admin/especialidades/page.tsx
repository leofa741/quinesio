'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react'; // ⚠️ IMPORTANTE: Usamos getSession de next-auth
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

interface Especialidad {
    _id: string;
    name: string;
    slug: string;
    description: string;
    count: number;
    image?: string;
    isActive: boolean;
}

export default function EspecialidadesPage() {
    const router = useRouter();
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEspecialidades();
    }, []);

    const fetchEspecialidades = async () => {
        try {
            // ⚠️ Obtenemos la sesión real de NextAuth
            const session = await getSession();
            
            if (!session) {
                Swal.fire('Sesión expirada', 'Por favor, inicia sesión nuevamente', 'warning');
                router.push('/login');
                return;
            }

            // Al hacer fetch a una ruta de tu propio dominio, Next.js envía las cookies de NextAuth automáticamente.
            // No necesitamos enviar headers manuales de Authorization.
            const res = await fetch('/api/gestion/especialidades');

            if (res.status === 401 || res.status === 403) {
                Swal.fire('Acceso denegado', 'No tienes permisos para ver esta sección', 'warning');
                router.push('/');
                return;
            }

            const data = await res.json();
            setEspecialidades(data);
        } catch (error) {
            console.error('Error al cargar especialidades:', error);
            Swal.fire('Error', 'No se pudieron cargar las especialidades', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const result = await Swal.fire({
            title: '¿Eliminar especialidad?',
            text: `Se eliminará "${name}" del sistema (se marcará como inactiva)`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (result.isConfirmed) {
            try {
                // ⚠️ Igual que arriba, la cookie se envía automáticamente
                const res = await fetch(`/api/gestion/especialidades/${id}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    Swal.fire('Eliminada', 'La especialidad ha sido eliminada correctamente', 'success');
                    fetchEspecialidades();
                } else {
                    const errorData = await res.json();
                    Swal.fire('Error', errorData.message || 'No se pudo eliminar', 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Ocurrió un error de red al eliminar', 'error');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mt-40 mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Gestión de Especialidades</h1>
                        <p className="text-slate-400">Administra las especialidades y actividades kinesiológicas</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/especialidades/create')}
                        className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-sky-500/50 transition-all font-medium"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Nueva Especialidad
                    </button>
                </div>

                {especialidades.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                        <p className="text-slate-400 text-lg mb-4">No hay especialidades registradas aún.</p>
                        <button onClick={() => router.push('/admin/especialidades/create')} className="text-sky-400 hover:text-sky-300 font-medium underline">
                            Crear la primera especialidad
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {especialidades.map((esp) => (
                            <div key={esp._id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:border-sky-500/50 transition-all flex flex-col">
                                {esp.image && (
                                    <div className="mb-4 rounded-xl overflow-hidden h-32 w-full bg-slate-700">
                                        <img src={esp.image} alt={esp.name} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white">{esp.name}</h3>
                                    <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-xs rounded-full font-medium">{esp.count} servicios</span>
                                </div>

                                <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">{esp.description}</p>

                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-900/50 p-2 rounded-lg">
                                    <span className="font-mono">/servicios/{esp.slug}</span>
                                </div>

                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => router.push(`/servicios/${esp.slug}`)} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white py-2.5 rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium">
                                        <FontAwesomeIcon icon={faEye} /> Ver
                                    </button>
                                    <button onClick={() => router.push(`/admin/especialidades/${esp._id}/edit`)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                        <FontAwesomeIcon icon={faEdit} /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(esp._id, esp.name)}
                                        className="flex items-center justify-center gap-2 bg-red-600/20 text-red-400 border border-red-600/50 px-4 py-2.5 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                                        title="Eliminar"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}