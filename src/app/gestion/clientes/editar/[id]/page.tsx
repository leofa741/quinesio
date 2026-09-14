'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuthorization } from '@/app/hooks/useAdminAuthorization';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { 
    FaUser, FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt, 
    FaIdCard, FaCreditCard, FaArrowLeft, FaCheck, FaSpinner,
    FaUndo, FaExclamationTriangle
} from 'react-icons/fa';

// 🎨 Sistema de diseño premium
const theme = {
    bg: 'bg-slate-950',
    bgCard: 'bg-slate-900/80',
    bgCardHover: 'bg-slate-800/90',
    border: 'border-slate-700/50',
    borderHover: 'border-purple-500/40',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-400',
    textAccent: 'text-purple-400',
    gradient: 'from-purple-600/20 via-violet-600/20 to-indigo-600/20',
    gradientBorder: 'from-purple-500 via-violet-500 to-indigo-500',
    gradientPrimary: 'from-violet-600 via-purple-600 to-indigo-600',
    shadow: 'shadow-2xl shadow-purple-900/20',
    shadowHover: 'shadow-purple-900/40',
};

// 🔹 Tipos
interface Cliente {
  _id: string;
  razonSocial: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  formaPago: 'efectivo' | 'transferencia' | 'qr' | 'tarjeta' | 'cuenta_corriente' | 'otro';
  activo: boolean;
}

interface ClienteForm {
  razonSocial: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  formaPago: 'efectivo' | 'transferencia' | 'qr' | 'tarjeta' | 'cuenta_corriente' | 'otro';
}

// 🚨 Estado para errores de campos específicos
interface FieldErrors {
  razonSocial?: string;
  dni?: string;
  telefono?: string;
  email?: string;
}

// 🎨 Helper para estilos de forma de pago
const getFormaPagoStyle = (forma: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
        cuenta_corriente: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
        efectivo: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
        transferencia: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
        qr: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
        tarjeta: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
        otro: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
    };
    return styles[forma] || styles.otro;
};

export default function EditarClientePage() {
  const isAuthorized = useAdminAuthorization();
  const { id } = useParams() as { id?: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClienteForm>({
    razonSocial: '', nombre: '', apellido: '', dni: '', telefono: '',
    email: '', direccion: '', ciudad: '', provincia: '', formaPago: 'efectivo',
  });
  const [originalForm, setOriginalForm] = useState<ClienteForm | null>(null);
  
  // 🚨 Estado para errores de validación en campos específicos
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!isAuthorized || !id) return;
    const fetchCliente = async () => {
      try {
        const res = await fetch(`/api/gestion/clientes/${id}`);
        if (!res.ok) { toast.error('Cliente no encontrado'); router.push('/gestion/clientes'); return; }
        const cliente: Cliente = await res.json();
        
        // ✅ FIX: Asegurar que TODOS los campos sean strings (nunca null/undefined)
        const formData: ClienteForm = {
          razonSocial: cliente.razonSocial || '',
          nombre: cliente.nombre || '',
          apellido: cliente.apellido || '',
          dni: cliente.dni || '',
          telefono: cliente.telefono || '',
          email: cliente.email || '',
          direccion: cliente.direccion || '',
          ciudad: cliente.ciudad || '',
          provincia: cliente.provincia || '',
          formaPago: cliente.formaPago || 'efectivo',
        };
        
        setForm(formData);
        setOriginalForm(formData);
      } catch (err) { 
        toast.error('Error al cargar el cliente'); 
        router.push('/gestion/clientes');
      } finally { 
        setLoading(false); 
      }
    };
    fetchCliente();
  }, [isAuthorized, id, router]);

  if (!isAuthorized) return null;
  if (loading) return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-violet-500 border-r-purple-500 mx-auto mb-4" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 blur-xl animate-pulse" />
        </div>
        <p className={`${theme.textSecondary}`}>Cargando datos del cliente...</p>
      </div>
    </div>
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // 🚨 Limpiar error del campo cuando el usuario empieza a escribir
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleReset = () => {
    if (originalForm) setForm(originalForm);
    setFieldErrors({});
    toast.info('Cambios descartados');
  };

  const validateForm = (): boolean => {
    if (!form.razonSocial.trim()) { toast.error('La razón social es obligatoria.'); return false; }
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio.'); return false; }
    if (!form.apellido.trim()) { toast.error('El apellido es obligatorio.'); return false; }
    if (!form.telefono.trim()) { toast.error('El teléfono es obligatorio.'); return false; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('El correo electrónico no es válido.'); return false;
    }
    if (form.dni && !/^\d{7,8}$/.test(form.dni.replace(/\D/g, ''))) {
      toast.error('El DNI debe tener 7 u 8 dígitos.'); return false;
    }
    return true;
  };

  // 🚨 Función para mapear errores del backend a campos específicos
  const mapBackendErrorToField = (errorMessage: string): FieldErrors => {
    const errors: FieldErrors = {};
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('razón social') || lowerError.includes('razon social')) {
      errors.razonSocial = '⚠️ ' + errorMessage;
    }
    if (lowerError.includes('teléfono') || lowerError.includes('telefono')) {
      errors.telefono = '⚠️ ' + errorMessage;
    }
    if (lowerError.includes('dni')) {
      errors.dni = '⚠️ ' + errorMessage;
    }
    if (lowerError.includes('email') || lowerError.includes('correo')) {
      errors.email = '⚠️ ' + errorMessage;
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !id) return;
    
    // 🚨 Limpiar errores anteriores antes de enviar
    setFieldErrors({});
    setSaving(true);
    
    try {
      const clienteData = {
        razonSocial: form.razonSocial.trim(), 
        nombre: form.nombre.trim(), 
        apellido: form.apellido.trim(),
        dni: form.dni.trim() || null, 
        telefono: form.telefono.trim(), 
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null, 
        ciudad: form.ciudad.trim() || null,
        provincia: form.provincia.trim() || null, 
        formaPago: form.formaPago,
      };
      
      const res = await fetch(`/api/gestion/clientes/${id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
      });
      
      if (res.ok) { 
        toast.success('✅ Cliente actualizado con éxito'); 
        router.push('/gestion/clientes');
      } else { 
        const error = await res.json();
        const errorMessage = error.error || 'Error al actualizar el cliente';
        
        // 🚨 Si es error 409 (duplicado), mostrar en el campo específico
        if (res.status === 409) {
          const fieldErrors = mapBackendErrorToField(errorMessage);
          setFieldErrors(fieldErrors);
          
          // Mostrar toast con el error específico
          toast.error(errorMessage);
          
          // Scroll al primer campo con error
          const firstErrorField = Object.keys(fieldErrors)[0];
          if (firstErrorField) {
            const element = document.querySelector(`[name="${firstErrorField}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              (element as HTMLInputElement).focus();
            }
          }
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (err: any) { 
      console.error(err); 
      toast.error('Error de conexión con el servidor');
    } finally { 
      setSaving(false); 
    }
  };

  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);

  // 🚨 Función helper para obtener clases de input según errores
  const getInputClassName = (fieldName: keyof FieldErrors, baseClasses: string) => {
    const hasError = fieldErrors[fieldName];
    
    if (hasError) {
      return `${baseClasses} border-rose-500/70 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-950/10`;
    }
    
    return baseClasses;
  };

  // 🚨 Componente para mostrar mensaje de error debajo del campo
  const FieldErrorMessage = ({ fieldName }: { fieldName: keyof FieldErrors }) => {
    const error = fieldErrors[fieldName];
    if (!error) return null;
    
    return (
      <div className="mt-2 flex items-start gap-2 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1 duration-300">
        <FaExclamationTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className="font-medium">{error}</span>
      </div>
    );
  };

  // Clases base para inputs
  const inputBaseClasses = `w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all`;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative overflow-hidden`}>
      <br/><br/><br/>
      
      {/* ✨ Background decorativo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-30`} />
        <div className={`absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl opacity-20`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      </div>

      {/* 🚨 ESPACIO PARA NAVBAR FIJO */}
      <div className="pt-24 lg:pt-28" />

      <div className="relative z-10 px-4 md:px-8 pb-12">

        {/* 🏷️ Header Premium */}
        <header className="mb-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              href="/gestion/clientes" 
              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.textSecondary} hover:${theme.textAccent} transition-all`}
            >
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm">Volver</span>
            </Link>
            <span className={`${theme.textSecondary}`}>/</span>
            <span className="text-sm text-slate-400">Clientes</span>
            <span className={`${theme.textSecondary}`}>/</span>
            <span className="text-sm text-white font-medium">Editar</span>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 mb-4">
            <FaBuilding className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] tracking-[0.25em] uppercase text-slate-400">Edición de Cliente</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
              Editar Cliente
            </span>
          </h1>
          <p className={`${theme.textSecondary} text-base font-light`}>
            Modificá los datos del cliente. Los cambios se guardarán en tiempo real.
          </p>
        </header>

        {/* 📋 Formulario Premium */}
        <main className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 md:p-8 backdrop-blur-sm ${theme.shadow}`}>
            
            {/* ✨ Glow effect decorativo superior */}
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${theme.gradientBorder} opacity-50`} />

            <div className="space-y-8">
              
              {/* 🏢 Sección: Datos Principales */}
              <section>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">1</span>
                  Datos Principales
                </h2>
                
                <div className="space-y-5">
                  {/* Razón Social */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <FaBuilding className="text-violet-400 w-4 h-4" />
                      Razón Social <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text" 
                      name="razonSocial" 
                      value={form.razonSocial} 
                      onChange={handleChange} 
                      required
                      className={getInputClassName('razonSocial', inputBaseClasses)}
                      placeholder="Ej: Inmobiliaria Premium SRL"
                    />
                    <FieldErrorMessage fieldName="razonSocial" />
                  </div>

                  {/* Nombre y Apellido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <FaUser className="text-violet-400 w-4 h-4" />
                        Nombre <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text" 
                        name="nombre" 
                        value={form.nombre} 
                        onChange={handleChange} 
                        required
                        className={inputBaseClasses}
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <FaUser className="text-violet-400 w-4 h-4" />
                        Apellido <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text" 
                        name="apellido" 
                        value={form.apellido} 
                        onChange={handleChange} 
                        required
                        className={inputBaseClasses}
                        placeholder="Pérez"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 📇 Sección: Contacto */}
              <section>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">2</span>
                  Información de Contacto
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* DNI */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <FaIdCard className="text-violet-400 w-4 h-4" />
                      DNI <span className="text-slate-500 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text" 
                      name="dni" 
                      value={form.dni} 
                      onChange={handleChange}
                      className={getInputClassName('dni', inputBaseClasses)}
                      placeholder="22222222"
                    />
                    <p className="text-xs text-slate-500 mt-1.5 ml-1">7 u 8 dígitos, sin puntos</p>
                    <FieldErrorMessage fieldName="dni" />
                  </div>
                  
                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <FaPhone className="text-violet-400 w-4 h-4" />
                      Teléfono <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text" 
                      name="telefono" 
                      value={form.telefono} 
                      onChange={handleChange} 
                      required
                      className={getInputClassName('telefono', inputBaseClasses)}
                      placeholder="11 1234-5678"
                    />
                    <FieldErrorMessage fieldName="telefono" />
                  </div>
                </div>

                {/* Email */}
                <div className="mt-5">
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <FaEnvelope className="text-violet-400 w-4 h-4" />
                    Email <span className="text-slate-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="email" 
                    name="email" 
                    value={form.email} 
                    onChange={handleChange}
                    className={getInputClassName('email', inputBaseClasses)}
                    placeholder="contacto@ejemplo.com"
                  />
                  <FieldErrorMessage fieldName="email" />
                </div>
              </section>

              {/* 📍 Sección: Ubicación */}
              <section>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">3</span>
                  Ubicación
                </h2>
                
                <div className="space-y-5">
                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-violet-400 w-4 h-4" />
                      Dirección <span className="text-slate-500 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text" 
                      name="direccion" 
                      value={form.direccion} 
                      onChange={handleChange}
                      className={inputBaseClasses}
                      placeholder="Av. Corrientes 1234, Piso 5"
                    />
                  </div>

                  {/* Ciudad y Provincia */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Ciudad <span className="text-slate-500 font-normal">(opcional)</span></label>
                      <input
                        type="text" 
                        name="ciudad" 
                        value={form.ciudad} 
                        onChange={handleChange}
                        className={inputBaseClasses}
                        placeholder="Buenos Aires"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Provincia <span className="text-slate-500 font-normal">(opcional)</span></label>
                      <input
                        type="text" 
                        name="provincia" 
                        value={form.provincia} 
                        onChange={handleChange}
                        className={inputBaseClasses}
                        placeholder="CABA"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* ✨ Divider decorativo */}
              <div className={`h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent`} />

              {/* 🎯 Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  type="submit" 
                  disabled={saving || !hasChanges}
                  className={`
                    group relative flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 
                    rounded-xl font-medium text-sm tracking-wide overflow-hidden
                    ${!hasChanges 
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
                      : `bg-gradient-to-r ${theme.gradientPrimary} text-white hover:shadow-lg hover:shadow-purple-900/40 hover:scale-[1.02]`
                    }
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                    transition-all duration-300
                  `}
                  title={!hasChanges ? 'No hay cambios para guardar' : 'Guardar modificaciones'}
                >
                  {/* Shine effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  {saving ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin relative z-10" />
                      <span className="relative z-10">Guardando...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform" />
                      <span className="relative z-10">Guardar Cambios</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving || !hasChanges}
                  className={`
                    flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 
                    rounded-xl font-medium text-sm tracking-wide
                    bg-slate-800/60 border border-slate-700/50 text-slate-300
                    hover:bg-slate-700/60 hover:border-violet-500/40 hover:text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-300
                  `}
                >
                  <FaUndo className="w-4 h-4" />
                  Descartar
                </button>
                
                <Link
                  href="/gestion/clientes"
                  className={`
                    flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 
                    rounded-xl font-medium text-sm tracking-wide
                    bg-rose-500/10 border border-rose-500/30 text-rose-400
                    hover:bg-rose-500/20 hover:border-rose-500/50
                    transition-all duration-300
                  `}
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </form>

          {/* 📌 Footer informativo */}
          <footer className="mt-6 text-center">
            <p className={`${theme.textSecondary} text-[10px] tracking-[0.25em] uppercase`}>
              Los campos marcados con <span className="text-rose-400">*</span> son obligatorios • 
              <span className="ml-1 text-violet-400"> {hasChanges ? '• Cambios sin guardar' : '• Todo actualizado'}</span>
              {Object.keys(fieldErrors).length > 0 && (
                <span className="ml-1 text-rose-400">• {Object.keys(fieldErrors).length} campo(s) con duplicados</span>
              )}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}