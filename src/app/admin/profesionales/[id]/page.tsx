'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faUserMd, faMoneyBillWave, faClock } from '@fortawesome/free-solid-svg-icons';

export default function ProfesionalFormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string; // 'nuevo' o el ID de MongoDB
  const isEdit = id !== 'nuevo';

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '', lastName: '', email: '', phone: '', password: '',
    matricula: '',
    especialidades: '', // String separado por comas para el input
    descripcionProfesional: '',
    horariosAtencion: '', // String separado por comas
    honorarios: {
      valorSesion: '',
      valorEvaluacion: '',
      duracionSesion: '60',
      moneda: 'ARS'
    }
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/profesionales');
      return;
    }
    if (status === 'authenticated' && isEdit) {
      fetchProfesional();
    } else {
      setIsLoading(false);
    }
  }, [status, router, isEdit, id]);

  const fetchProfesional = async () => {
    try {
      const res = await fetch(`/api/admin/profesionales?id=${id}`);
      const data = await res.json();
      if (data.success && data.profesionales[0]) {
        const p = data.profesionales[0];
        setFormData({
          name: p.name || '',
          lastName: p.lastName || '',
          email: p.email || '',
          phone: p.phone || '',
          password: '', // No se muestra la contraseña
          matricula: p.matricula || '',
          especialidades: p.especialidades?.join(', ') || '',
          descripcionProfesional: p.descripcionProfesional || '',
          horariosAtencion: p.horariosAtencion?.join(', ') || '',
          honorarios: {
            valorSesion: p.honorarios?.valorSesion?.toString() || '',
            valorEvaluacion: p.honorarios?.valorEvaluacion?.toString() || '',
            duracionSesion: p.honorarios?.duracionSesion?.toString() || '60',
            moneda: p.honorarios?.moneda || 'ARS'
          }
        });
      }
    } catch (error) {
      toast.error('Error al cargar datos del profesional');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('honorarios.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        honorarios: { ...prev.honorarios, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/admin/profesionales?id=${id}` : '/api/admin/profesionales';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? 'Profesional actualizado' : 'Profesional creado con éxito');
        router.push('/admin/profesionales');
      } else {
        toast.error(data.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition";
  const labelClass = "block text-sm font-medium text-slate-400 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mt-30 mx-auto">
        <Link href="/admin/profesionales" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-6 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Volver al listado
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faUserMd} className="text-sky-500" />
          {isEdit ? 'Editar Profesional' : 'Nuevo Profesional'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sección 1: Datos de Cuenta */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Datos de Cuenta y Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Nombre *</label><input name="name" value={formData.name} onChange={handleChange} required className={inputClass} /></div>
              <div><label className={labelClass}>Apellido *</label><input name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} /></div>
              <div><label className={labelClass}>Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} /></div>
              <div><label className={labelClass}>Teléfono</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} /></div>
              {!isEdit && (
                <div className="md:col-span-2">
                  <label className={labelClass}>Contraseña inicial {!isEdit && <span className="text-slate-500 text-xs">(Por defecto: 123456)<span className="text-red-500 text-xs">(Para logeo con google no es necesaria la contraseña)  </span>   </span>  }</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Dejar vacío para usar 123456" className={inputClass} />
                </div>
              )}
            </div>
          </div>

          {/* Sección 2: Datos Profesionales */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Información Profesional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Matrícula</label><input name="matricula" value={formData.matricula} onChange={handleChange} placeholder="Ej: MN 12345" className={inputClass} /></div>
              <div className="md:col-span-2">
                <label className={labelClass}>Especialidades <span className="text-slate-500 text-xs">(Separadas por coma)</span></label>
                <input name="especialidades" value={formData.especialidades} onChange={handleChange} placeholder="Ej: Kinesiología Deportiva, Rehabilitación, Pilates" className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Descripción / Biografía</label>
                <textarea name="descripcionProfesional" value={formData.descripcionProfesional} onChange={handleChange} rows={3} placeholder="Breve descripción para la vista del paciente..." className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Horarios de Atención <span className="text-slate-500 text-xs">(Separados por coma)</span></label>
                <input name="horariosAtencion" value={formData.horariosAtencion} onChange={handleChange} placeholder="Ej: Lunes 9-12, Miércoles 14-18" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Sección 3: Honorarios */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-emerald-500" /> Honorarios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Moneda</label>
                <select name="honorarios.moneda" value={formData.honorarios.moneda} onChange={handleChange} className={inputClass}>
                  <option value="ARS">Peso Argentino (ARS)</option>
                  <option value="USD">Dólar (USD)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Valor por Sesión</label>
                <input type="number" name="honorarios.valorSesion" value={formData.honorarios.valorSesion} onChange={handleChange} min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Valor Evaluación Inicial <span className="text-slate-500 text-xs">(Opcional)</span></label>
                <input type="number" name="honorarios.valorEvaluacion" value={formData.honorarios.valorEvaluacion} onChange={handleChange} min="0" className={inputClass} />
              </div>
              <div>
                <label className={`${labelClass} flex items-center gap-2`}><FontAwesomeIcon icon={faClock} className="text-xs" /> Duración (minutos)</label>
                <input type="number" name="honorarios.duracionSesion" value={formData.honorarios.duracionSesion} onChange={handleChange} min="15" step="15" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4 pt-4">
            <Link href="/admin/profesionales" className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2 shadow-lg shadow-sky-900/20"
            >
              {isSaving ? 'Guardando...' : <><FontAwesomeIcon icon={faSave} /> Guardar Profesional</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}