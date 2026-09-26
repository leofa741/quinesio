'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faMagic, faImage } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

export default function CreateEspecialidadPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !slug) {
      Swal.fire('Error', 'Nombre, descripción y slug son obligatorios', 'warning');
      return;
    }

    setLoading(true);

    try {
      // 1. Construimos FormData para soportar la subida de archivos
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('description', description);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // 2. Obtenemos el token (ajusta 'token' si lo guardas con otro nombre, ej: 'next-auth.session-token')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch('/api/gestion/especialidades', {
        method: 'POST',
        headers: {
          // ⚠️ NO pongas 'Content-Type': 'application/json'. 
          // El navegador lo establece automáticamente con el "boundary" correcto para FormData.
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Creado!',
          text: 'La especialidad se ha creado correctamente.',
          timer: 1500,
          showConfirmButton: false
        });
        router.push('/admin/especialidades');
        router.refresh(); // Fuerza la recarga de datos en el listado
      } else {
        const errorData = await res.json();
        Swal.fire('Error', errorData.message || 'No se pudo crear la especialidad', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Ocurrió un error de red', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto mt-20">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Nueva Especialidad</h1>
            <p className="text-slate-400">Completa los datos para crear una nueva actividad</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de la Especialidad</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Ej: Kinesiología Deportiva"
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
                title="Generar slug automáticamente"
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
                placeholder="kinesiologia-deportiva"
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
              placeholder="Describe brevemente en qué consiste esta especialidad..."
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
              required
            />
          </div>

          {/* Imagen (Nuevo) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Imagen de portada (Opcional)</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-dashed border-slate-600 rounded-xl px-4 py-6 cursor-pointer hover:border-sky-500 hover:bg-slate-800 transition-all">
                <FontAwesomeIcon icon={faImage} className="text-slate-400 text-xl" />
                <span className="text-slate-400 text-sm">
                  {imageFile ? imageFile.name : 'Seleccionar imagen'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <button type="button" onClick={() => setImageFile(null)} className="text-red-400 hover:text-red-300 text-sm">
                  Quitar
                </button>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl text-slate-300 hover:bg-slate-700 transition-all font-medium" disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-sky-500/50 transition-all font-medium disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faSave} />
              {loading ? 'Guardando...' : 'Guardar Especialidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}