'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { 
  FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaHospital, FaCalendarAlt, FaUpload, FaSpinner, FaCheck
} from 'react-icons/fa';

const showNotification = (icon: 'success' | 'error' | 'warning' | 'info', title: string, text?: string) => {
  Swal.fire({
    icon, title, text, toast: true, position: 'top-end', showConfirmButton: false,
    timer: 3500, timerProgressBar: true, background: '#1e293b', color: '#f1f5f9',
    customClass: { popup: 'border border-slate-700 rounded-lg shadow-xl', timerProgressBar: 'bg-sky-500' },
  });
};

export default function EditarMiPerfilPage() {
  const { status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', lastName: '', email: '', phone: '', address: '', city: '', zipCode: '',
    fechaNacimiento: '', obraSocialNombre: '', obraSocialCodigo: '', obraSocialPlan: '', obraSocialNumeroAfiliado: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') { router.push('/login?callbackUrl=/profile/edit'); return; }

      try {
        // ✅ Sin headers manuales, NextAuth usa la cookie automáticamente
        const res = await fetch('/api/profile'); 
        if (!res.ok) throw new Error('Error cargando perfil');
        
        const data = await res.json();
        const user = data.user;
        
        setFormData({
          name: user.name || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '',
          address: user.address || '', city: user.city || '', zipCode: user.zipCode || '',
          fechaNacimiento: user.fechaNacimiento ? new Date(user.fechaNacimiento).toISOString().split('T')[0] : '',
          obraSocialNombre: user.obraSocial?.nombre || '', obraSocialCodigo: user.obraSocial?.codigo || '',
          obraSocialPlan: user.obraSocial?.plan || '', obraSocialNumeroAfiliado: user.obraSocial?.numeroAfiliado || '',
        });
        if (user.img) setPreviewImg(user.img);
      } catch (err) {
        showNotification('error', '⚠️ Error de carga', 'No se pudieron cargar los datos del perfil');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return showNotification('error', '📷 Formato inválido', 'Solo imágenes (JPG, PNG)');
      if (file.size > 5 * 1024 * 1024) return showNotification('error', '📷 Archivo muy grande', 'Máximo 5MB');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.lastName || !formData.email) {
      return showNotification('error', '❌ Campos obligatorios', 'Nombre, apellido y email son requeridos');
    }
    
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      
      // Agregamos todos los campos básicos
      Object.entries(formData).forEach(([key, value]) => {
        if (!key.startsWith('obraSocial')) {
          formDataToSend.append(key, value);
        }
      });
      
      // Agregamos la obra social como JSON
      const obraSocialData = {
        nombre: formData.obraSocialNombre, codigo: formData.obraSocialCodigo,
        plan: formData.obraSocialPlan, numeroAfiliado: formData.obraSocialNumeroAfiliado, activo: true,
      };
      formDataToSend.append('obraSocial', JSON.stringify(obraSocialData));
      
      // Agregamos la imagen si se seleccionó una nueva
      if (selectedFile) formDataToSend.append('img', selectedFile);
      
      // ✅ Sin headers manuales, NextAuth usa la cookie automáticamente
      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formDataToSend,
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', '✅ ¡Actualizado!', 'Tu perfil se guardó exitosamente');
        setTimeout(() => router.push('/profile'), 1500);
      } else {
        showNotification('error', '❌ Error', data.message || 'No se pudo actualizar el perfil');
      }
    } catch (err) {
      showNotification('error', '⚠️ Error de conexión', 'Intentá nuevamente en unos segundos');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 flex items-center gap-3 text-lg">
          <FaSpinner className="animate-spin text-sky-500" /> Cargando tu perfil...
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto mt-8 mb-8">
        <button onClick={() => router.push('/profile')} className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-4">
          <FaArrowLeft /> Volver a mi perfil
        </button>
        <h1 className="text-2xl md:text-3xl font-bold">Editar mi Perfil</h1>
        <p className="text-slate-400 text-sm mt-1">Actualizá tus datos personales y de obra social.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* Datos Personales */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-sky-400"><FaUser /> Datos Personales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-400 mb-1">Nombre *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} /></div>
            <div><label className="block text-sm text-slate-400 mb-1">Apellido *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} /></div>
            <div className="md:col-span-2"><label className="block text-sm text-slate-400 mb-1">Email *</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={`${inputClass} pl-10`} />
              </div></div>
            <div><label className="block text-sm text-slate-400 mb-1">Teléfono</label>
              <div className="relative">
                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} pl-10`} />
              </div></div>
            <div><label className="block text-sm text-slate-400 mb-1">Fecha de Nacimiento</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className={`${inputClass} pl-10`} />
              </div></div>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-sky-400"><FaMapMarkerAlt /> Dirección</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-400 mb-1">Ciudad</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} /></div>
            <div><label className="block text-sm text-slate-400 mb-1">Código Postal</label>
              <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className={inputClass} /></div>
            <div className="md:col-span-2"><label className="block text-sm text-slate-400 mb-1">Dirección</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} /></div>
          </div>
        </div>

        {/* Obra Social */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-sky-400"><FaHospital /> Obra Social / Prepaga</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-400 mb-1">Nombre</label>
              <input type="text" name="obraSocialNombre" value={formData.obraSocialNombre} onChange={handleChange} className={inputClass} placeholder="Ej: OSDE, Swiss Medical..." /></div>
            <div><label className="block text-sm text-slate-400 mb-1">Código de Afiliado</label>
              <input type="text" name="obraSocialCodigo" value={formData.obraSocialCodigo} onChange={handleChange} className={inputClass} /></div>
            <div><label className="block text-sm text-slate-400 mb-1">Plan / Cobertura</label>
              <input type="text" name="obraSocialPlan" value={formData.obraSocialPlan} onChange={handleChange} className={inputClass} /></div>
            <div><label className="block text-sm text-slate-400 mb-1">N° de Afiliado</label>
              <input type="text" name="obraSocialNumeroAfiliado" value={formData.obraSocialNumeroAfiliado} onChange={handleChange} className={inputClass} /></div>
          </div>
        </div>

        {/* Foto de Perfil */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-sky-400"><FaUpload /> Foto de Perfil</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700 flex-shrink-0">
              {previewImg ? <Image src={previewImg} alt="Preview" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FaUser className="w-8 h-8 text-slate-600" /></div>}
            </div>
            <div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors flex items-center gap-2 text-slate-300">
                <FaUpload /> {previewImg ? 'Cambiar foto' : 'Seleccionar imagen'}
              </button>
              <p className="text-xs text-slate-500 mt-2">Formatos: JPG, PNG • Tamaño máximo: 5MB</p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800 pb-8">
          <button type="button" onClick={() => router.push('/profile')} className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancelar</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2 shadow-lg shadow-sky-900/20">
            {saving ? <><FaSpinner className="animate-spin" /> Guardando...</> : <><FaCheck /> Guardar Cambios</>}
          </button>
        </div>
      </form>
    </div>
  );
}