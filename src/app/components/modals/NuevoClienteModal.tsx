'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaCheck, FaSpinner, FaXmark } from 'react-icons/fa6';

// 🎨 Mismo sistema de diseño que tu panel
const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/95',
  border: 'border-slate-700/50',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
  gradient: 'from-purple-600/20 via-violet-600/20 to-indigo-600/20',
  gradientBorder: 'from-purple-500 via-violet-500 to-indigo-500',
  gradientPrimary: 'from-violet-600 via-purple-600 to-indigo-600',
  shadow: 'shadow-2xl shadow-purple-900/40',
};

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

interface NuevoClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (clienteId: string, clienteData: any) => void;
}

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

export default function NuevoClienteModal({ isOpen, onClose, onSuccess }: NuevoClienteModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ClienteForm>({
    razonSocial: '', nombre: '', apellido: '', dni: '', telefono: '',
    email: '', direccion: '', ciudad: '', provincia: '', formaPago: 'efectivo',
  });

  // Resetear form al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setForm({
        razonSocial: '', nombre: '', apellido: '', dni: '', telefono: '',
        email: '', direccion: '', ciudad: '', provincia: '', formaPago: 'efectivo',
      });
    }
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
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

      const res = await fetch('/api/gestion/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
      });

      if (res.ok) {
        const nuevoCliente = await res.json();
        toast.success('✅ Cliente creado con éxito');
        
        // 🔹 Callback al padre con el nuevo cliente
        onSuccess?.(nuevoCliente._id, nuevoCliente);
        
        // Cerrar modal
        onClose();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear el cliente');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay con blur */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        onClick={() => !loading && onClose()}
      />
      
      {/* Modal Card - Scrollable si es necesario */}
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ${theme.bgCard} ${theme.border} rounded-2xl ${theme.shadow} backdrop-blur-sm`}>
        
        {/* ✨ Glow decorativo superior */}
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${theme.gradientBorder} opacity-50`} />
        
        {/* Header sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
          <div>
            <h3 className="text-lg font-semibold text-white">Nuevo Cliente</h3>
            <p className="text-sm text-slate-400">Completá los datos para registrar un nuevo cliente</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* 🏢 Datos Principales */}
          <section>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px]">1</span>
              Datos Principales
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Razón Social <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text" name="razonSocial" value={form.razonSocial} onChange={handleChange} required
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  placeholder="Ej: Inmobiliaria Premium SRL"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Nombre <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text" name="nombre" value={form.nombre} onChange={handleChange} required
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Apellido <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text" name="apellido" value={form.apellido} onChange={handleChange} required
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    placeholder="Pérez"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 📇 Contacto */}
          <section>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px]">2</span>
              Contacto
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  DNI <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text" name="dni" value={form.dni} onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  placeholder="22222222"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Teléfono <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel" name="telefono" value={form.telefono} onChange={handleChange} required
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  placeholder="11 1234-5678"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                placeholder="contacto@ejemplo.com"
              />
            </div>
          </section>

          {/* 📍 Ubicación (colapsable si querés ahorrar espacio) */}
          <section>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px]">3</span>
              Ubicación <span className="text-slate-500 font-normal text-[10px]">(opcional)</span>
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Dirección</label>
                <input
                  type="text" name="direccion" value={form.direccion} onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  placeholder="Av. Corrientes 1234"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Ciudad</label>
                  <input
                    type="text" name="ciudad" value={form.ciudad} onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    placeholder="Buenos Aires"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Provincia</label>
                  <input
                    type="text" name="provincia" value={form.provincia} onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    placeholder="CABA"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 💳 Forma de Pago 
          <section>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px]">4</span>
              Forma de Pago
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(['efectivo', 'transferencia', 'qr', 'tarjeta', 'cuenta_corriente', 'otro'] as const).map((opcion) => {
                const style = getFormaPagoStyle(opcion);
                const labels: Record<string, string> = {
                  efectivo: 'Efectivo', transferencia: 'Transferencia', qr: 'QR',
                  tarjeta: 'Tarjeta', cuenta_corriente: 'Cta. Cte.', otro: 'Otro'
                };
                return (
                  <label 
                    key={opcion}
                    className={`
                      relative cursor-pointer px-3 py-2 rounded-lg border text-center text-xs font-medium transition-all
                      ${form.formaPago === opcion 
                        ? `${style.bg} ${style.text} border-violet-500/50 ring-1 ring-violet-500/30` 
                        : `bg-slate-800/40 border-slate-600/30 text-slate-400 hover:border-violet-500/30`
                      }
                    `}
                  >
                    <input
                      type="radio" name="formaPago" value={opcion} checked={form.formaPago === opcion} onChange={handleChange}
                      className="sr-only"
                      disabled={loading}
                    />
                    {labels[opcion]}
                  </label>
                );
              })}
            </div>
          </section>*/}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-slate-700/50">
            <button
              type="submit"
              disabled={loading}
              className={`
                flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                bg-gradient-to-r ${theme.gradientPrimary} text-white
                hover:shadow-lg hover:shadow-purple-900/40 transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            >
              {loading ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <FaCheck className="w-4 h-4" />
                  Crear Cliente
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:text-white rounded-xl transition-all disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}