'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faMagic, faImage, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

interface Especialidad {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: string | null;
}

export default function EditEspecialidadPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Estados del formulario
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  
  // Estados de carga
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [especialidadId, setEspecialidadId] = useState<string>('');

  // 1. Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      setEspecialidadId(resolvedParams.id);

      try {
        // Obtenemos todas y filtramos por ID (ya que no tenemos un endpoint GET por ID individual)
        const res = await fetch('/api/gestion/especialidades');
        const data = await res.json();
        
        const esp = data.find((item: Especialidad) => item._id === resolvedParams.id);
        
        if (esp) {
          setName(esp.name);
          setSlug(esp.slug);
          setDescription(esp.description);
          setCurrentImage(esp.image || null);
        } else {
          Swal.fire('Error', 'Especialidad no encontrada', 'error');
          router.push('/admin/especialidades');
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [params, router]);

  // 2. Generar slug automáticamente al cambiar el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    
    const generatedSlug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
      
    setSlug(generatedSlug);
  };

  // 3. Manejar el envío del formulario (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !slug) {
      Swal.fire('Error', 'Nombre, descripción y slug son obligatorios', 'warning');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('description', description);
      
      // Solo enviamos la imagen si el usuario seleccionó una nueva
      if (newImageFile) {
        formData.append('image', newImageFile);
      }

      const res = await fetch(`/api/gestion/especialidades/${especialidadId}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La especialidad se ha modificado correctamente.',
          timer: 1500,
          showConfirmButton: false
        });
        router.push('/admin/especialidades');
        router.refresh();
      } else {
        const errorData = await res.json();
        Swal.fire('Error', errorData.message || 'No se pudo actualizar', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Ocurrió un error de red', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Vista de carga inicial
  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto mt-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()} 
            className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Editar Especialidad</h1>
            <p className="text-slate-400">Modifica los datos de la actividad</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de la Especialidad</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const autoSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
                  setSlug(autoSlug);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-300 text-sm flex items-center gap-1"
                title="Regenerar slug"
              >
                <FontAwesomeIcon icon={faMagic} /> Auto
              </button>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">URL (Slug)</label>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
              <span className="text-slate-500 text-sm mr-2">/servicios/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent text-sky-400 focus:outline-none font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
              required
            />
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Imagen de portada</label>
            
            {/* Preview de la imagen actual o la nueva seleccionada */}
            {(currentImage || newImageFile) && (
              <div className="mb-3 relative w-full h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                <img 
                  src={newImageFile ? URL.createObjectURL(newImageFile) : currentImage!} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">Vista previa</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-dashed border-slate-600 rounded-xl px-4 py-6 cursor-pointer hover:border-sky-500 hover:bg-slate-800 transition-all">
                <FontAwesomeIcon icon={faImage} className="text-slate-400 text-xl" />
                <span className="text-slate-400 text-sm">
                  {newImageFile ? newImageFile.name : 'Cambiar imagen (opcional)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              
              {(currentImage || newImageFile) && (
                <button 
                  type="button" 
                  onClick={() => {
                    setNewImageFile(null);
                    // Nota: No borramos currentImage del estado para que si cancela, siga estando la original,
                    // pero si quiere quitarla por completo, podrías agregar un checkbox "Quitar imagen".
                  }} 
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Cancelar cambio
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              * Si no seleccionas una nueva, se mantendrá la imagen actual.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="px-6 py-3 rounded-xl text-slate-300 hover:bg-slate-700 transition-all font-medium" 
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-sky-500/50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faSave} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}