'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Swal from 'sweetalert2'; // ✅ Importar SweetAlert2
import { 
  FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaHospital, FaIdCard, FaCalendarAlt, FaUpload, FaSpinner, FaCheck,
  FaTrash
} from 'react-icons/fa';


interface Paciente {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  img?: string;
  role: string;
  activo?: boolean;
  obraSocial?: {
    nombre?: string;
    codigo?: string;
    plan?: string;
    numeroAfiliado?: string;
    activo?: boolean;
  };
  diagnosticoPrincipal?: string;
  fechaNacimiento?: string;
  dniUrl?: string;
  createdAt?: string;
}

// 🔹 Helper para notificaciones con tema oscuro
const showNotification = (
  icon: 'success' | 'error' | 'warning' | 'info',
  title: string,
  text?: string
) => {
  Swal.fire({
    icon,
    title,
    text,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    background: '#1e293b', // slate-900
    color: '#f1f5f9', // slate-100
    customClass: {
      popup: 'border border-slate-700',
      timerProgressBar: 'bg-sky-500',
    },
  });
};

export default function EditarPacientePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pacienteId = params?.id as string;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // 🔹 Datos del formulario
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    obraSocialNombre: '',
    obraSocialCodigo: '',
    obraSocialPlan: '',
    obraSocialNumeroAfiliado: '',
    diagnosticoPrincipal: '',
    fechaNacimiento: '',
    activo: true,
  });

  // 🔹 Validar acceso y cargar datos del paciente
  useEffect(() => {
    const validateAndLoad = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') {
        router.push('/login?callbackUrl=/gestion/pacientes');
        return;
      }

      const token = session?.user?.token;
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Verificar rol
        const payload = JSON.parse(atob(token.split('.')[1]));
        const allowedRoles = ['admin', 'profesionales', 'administrativos'];
        
        if (!allowedRoles.includes(payload.role)) {
          showNotification('warning', '🔐 Sin permisos', 'No tenés permisos para editar pacientes');
          router.push('/gestion');
          return;
        }
        setIsAuthorized(true);
        
        // Cargar datos del paciente
        const res = await fetch(`/api/pacientes/${pacienteId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 404) {
          showNotification('error', 'Paciente no encontrado');
          router.push('/gestion/pacientes');
          return;
        }
        
        if (!res.ok) throw new Error('Error cargando paciente');
        
        const paciente: Paciente = await res.json();
        
        // ✅ Llenar formulario
        setFormData({
          name: paciente.name || '',
          lastName: paciente.lastName || '',
          email: paciente.email || '',
          phone: paciente.phone || '',
          address: paciente.address || '',
          city: paciente.city || '',
          zipCode: paciente.zipCode || '',
          obraSocialNombre: paciente.obraSocial?.nombre || '',
          obraSocialCodigo: paciente.obraSocial?.codigo || '',
          obraSocialPlan: paciente.obraSocial?.plan || '',
          obraSocialNumeroAfiliado: paciente.obraSocial?.numeroAfiliado || '',
          diagnosticoPrincipal: paciente.diagnosticoPrincipal || '',
          fechaNacimiento: paciente.fechaNacimiento 
            ? new Date(paciente.fechaNacimiento).toISOString().split('T')[0] 
            : '',
          activo: paciente.activo !== false,
        });
        
        if (paciente.img) setPreviewImg(paciente.img);
        
      } catch (err) {
        console.error('Error:', err);
        showNotification('error', '⚠️ Error de carga', 'No se pudieron cargar los datos del paciente');
        router.push('/gestion/pacientes');
      } finally {
        setLoading(false);
      }
    };
    
    if (pacienteId) validateAndLoad();
  }, [status, session, router, pacienteId]);

  // 🔹 Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('error', '📷 Formato inválido', 'Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', '📷 Archivo muy grande', 'La imagen no puede superar los 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.lastName || !formData.email) {
      showNotification('error', '❌ Campos obligatorios', 'Nombre, apellido y email son requeridos');
      return;
    }
    
    setSaving(true);

    try {
      const token = session?.user?.token;
      
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email.toLowerCase());
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('zipCode', formData.zipCode);
      formDataToSend.append('diagnosticoPrincipal', formData.diagnosticoPrincipal);
      formDataToSend.append('fechaNacimiento', formData.fechaNacimiento);
      formDataToSend.append('activo', formData.activo.toString());
      
      const obraSocialData = {
        nombre: formData.obraSocialNombre,
        codigo: formData.obraSocialCodigo,
        plan: formData.obraSocialPlan,
        numeroAfiliado: formData.obraSocialNumeroAfiliado,
        activo: true,
      };
      formDataToSend.append('obraSocial', JSON.stringify(obraSocialData));
      
      if (selectedFile) {
        formDataToSend.append('img', selectedFile);
      }
      
      const res = await fetch(`/api/pacientes/${pacienteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('success', '✅ Actualizado', 'Paciente actualizado exitosamente');
        setTimeout(() => router.push(`/gestion/pacientes`), 1500);
      } else {
        showNotification('error', '❌ Error', data.error || 'No se pudo actualizar el paciente');
      }
      
    } catch (err) {
      console.error('Error:', err);
      showNotification('error', '⚠️ Error de conexión', 'Intentá nuevamente en unos segundos');
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivar = async () => {
    // ✅ Confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Desactivar paciente?',
      text: 'Podrá reactivarse luego desde el listado',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      background: '#1e293b',
      color: '#f1f5f9',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'border border-slate-700',
        confirmButton: 'font-medium',
        cancelButton: 'font-medium',
      },
    });

    if (!result.isConfirmed) return;
    
    try {
      const token = session?.user?.token;
      const res = await fetch(`/api/pacientes/${pacienteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        showNotification('success', '✅ Desactivado', 'El paciente ha sido desactivado');
        setTimeout(() => router.push('/gestion/pacientes'), 1500);
      } else {
        showNotification('error', '❌ Error', 'No se pudo desactivar el paciente');
      }
    } catch (err) {
      console.error('Error:', err);
      showNotification('error', '⚠️ Error de conexión', 'Intentá nuevamente');
    }
  };

  // 🔹 Loader / No autorizado
  if (status === 'loading' || loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 flex items-center gap-3">
          <FaSpinner className="animate-spin" />
          {loading ? 'Cargando datos...' : 'Verificando permisos...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mt-32 mb-8">
        <button 
          onClick={() => router.push('/gestion/pacientes')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <FaArrowLeft /> Volver al listado
        </button>
        <h1 className="text-2xl md:text-3xl font-bold">Editar Paciente</h1>
        <p className="text-slate-400 text-sm mt-1">
          Modificá los datos del paciente. Los cambios se guardarán automáticamente.
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        
        {/* 🔹 Datos Personales */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaUser className="text-sky-400" /> Datos Personales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Apellido *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Email *</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
              <div className="relative">
                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Fecha de Nacimiento</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 Dirección */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-sky-400" /> Dirección
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Ciudad</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Código Postal</label>
              <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Dirección</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
          </div>
        </div>

        {/* 🔹 Obra Social */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaHospital className="text-sky-400" /> Obra Social
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Obra Social</label>
              <input type="text" name="obraSocialNombre" value={formData.obraSocialNombre} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" 
                placeholder="Ej: OSDE, Swiss Medical..." />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Código de Afiliado</label>
              <input type="text" name="obraSocialCodigo" value={formData.obraSocialCodigo} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Plan / Cobertura</label>
              <input type="text" name="obraSocialPlan" value={formData.obraSocialPlan} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">N° de Afiliado</label>
              <input type="text" name="obraSocialNumeroAfiliado" value={formData.obraSocialNumeroAfiliado} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
          </div>
        </div>

        {/* 🔹 Foto de Perfil */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaUpload className="text-sky-400" /> Foto de Perfil
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700">
              {previewImg ? (
                <Image src={previewImg} alt="Preview" fill className="object-cover" />
              ) : (
                <FaUser className="w-full h-full p-6 text-slate-600" />
              )}
            </div>
            <div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors flex items-center gap-2">
                <FaUpload /> {previewImg ? 'Cambiar foto' : 'Seleccionar imagen'}
              </button>
              <p className="text-xs text-slate-500 mt-2">JPG, PNG • Máx. 5MB</p>
            </div>
          </div>
        </div>

        {/* 🔹 Notas Clínicas */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaIdCard className="text-sky-400" /> Notas Clínicas
          </h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Diagnóstico / Observaciones</label>
            <textarea name="diagnosticoPrincipal" value={formData.diagnosticoPrincipal} onChange={handleChange} rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 resize-none"
              placeholder="Diagnóstico inicial, observaciones relevantes, etc." />
          </div>
        </div>

        {/* 🔹 Configuración de Cuenta */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaIdCard className="text-sky-400" /> Estado de la Cuenta
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Estado de la Cuenta</label>
              <label className="flex items-center gap-3 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer">
                <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange}
                  className="rounded border-slate-600 text-sky-500 focus:ring-sky-500" />
                <span className="text-sm text-slate-300">
                  {formData.activo ? '✅ Activo' : '❌ Inactivo'}
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-1">
                Los pacientes inactivos no aparecerán en búsquedas ni podrán agendar turnos
              </p>
            </div>
            
            <div className="flex items-center">
              <div className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg">
                <span className="text-sm text-slate-400">Rol: </span>
                <span className="text-sm font-medium text-sky-400">Paciente</span>
                <p className="text-xs text-slate-500 mt-1">
                  El rol solo puede ser modificado por un administrador desde la sección de usuarios
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 Botones de Acción */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDesactivar}
            className="px-4 py-2.5 rounded-lg border border-rose-700/50 text-rose-400 hover:bg-rose-700/20 transition-colors flex items-center gap-2"
          >
            <FaTrash /> Desactivar Paciente
          </button>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/gestion/pacientes')}
              className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
            >
              {saving ? (
                <><FaSpinner className="animate-spin" /> Guardando...</>
              ) : (
                <><FaCheck /> Guardar Cambios</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}