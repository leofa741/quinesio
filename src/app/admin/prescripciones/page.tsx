'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilePrescription, faPlus, faSearch, faSpinner,
  faCheckCircle, faTimes, faEye, faBan, faCopy,
  faCalendarAlt, faExclamationTriangle, faUserPlus, faPrint
} from '@fortawesome/free-solid-svg-icons';
import { FaArrowLeft } from 'react-icons/fa';

export default function PrescripcionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [prescripciones, setPrescripciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);

  const [pacientesList, setPacientesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', lastName: '', email: '', phone: '' });
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  const [formData, setFormData] = useState({
    pacienteId: '',
    diagnostico: '',
    prescripcion: '',
    indicaciones: '',
    contraindicaciones: '',
    diasValidez: 30
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/prescripciones');
      return;
    }
    if (status === 'authenticated') fetchPrescripciones();
  }, [status, router]);

  const fetchPrescripciones = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prescripciones');
      const data = await res.json();
      if (data.success) setPrescripciones(data.prescripciones);
    } catch (error) {
      toast.error('Error al cargar prescripciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientesList = async (searchTerm: string) => {
    if (searchTerm.length < 2) { setPacientesList([]); setIsSearching(false); return; }
    setIsSearching(true);
    try {
      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`/api/pacientes?search=${encodeURIComponent(searchTerm)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) { const data = await res.json(); setPacientesList(data.pacientes || []); }
      else setPacientesList([]);
    } catch { setPacientesList([]); }
    finally { setIsSearching(false); }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchPacientesList(value), 400);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPatient(true);
    try {
      const token = session?.user?.token || localStorage.getItem('token');
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newPatient.name,
          lastName: newPatient.lastName,
          email: newPatient.email,
          phone: newPatient.phone,
          role: 'pacientes',
          activo: true
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Paciente creado exitosamente');
        setFormData({ ...formData, pacienteId: data._id });
        setSearchQuery(`${data.name} ${data.lastName}`);
        setShowCreatePatient(false);
        setNewPatient({ name: '', lastName: '', email: '', phone: '' });
        setPacientesList([]);
      } else {
        toast.error(data.error || 'Error al crear paciente');
      }
    } catch (error) {
      toast.error('Error de conexión al crear paciente');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pacienteId || !formData.diagnostico || !formData.prescripcion) {
      toast.error('Completá los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/prescripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Prescripción emitida exitosamente');
        setShowForm(false);
        setFormData({ pacienteId: '', diagnostico: '', prescripcion: '', indicaciones: '', contraindicaciones: '', diasValidez: 30 });
        setSearchQuery('');
        fetchPrescripciones();
      } else {
        toast.error(data.message || 'Error al emitir');
      }
    } catch { toast.error('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleAnular = async (id: string) => {
    if (!confirm('¿Estás seguro de anular esta prescripción?')) return;
    try {
      const res = await fetch(`/api/prescripciones?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'anulada' })
      });
      if (res.ok) {
        toast.success('Prescripción anulada');
        fetchPrescripciones();
        setShowDetail(null);
      }
    } catch { toast.error('Error al anular'); }
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success('📋 Código copiado al portapapeles');
  };

  // ✅ FUNCIÓN PARA GENERAR PDF / IMPRIMIR
  const handlePrint = (p: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Permití las ventanas emergentes para imprimir');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescripción Kinesiológica - ${p.codigoVerificacion}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          .header { text-align: center; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0ea5e9; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 8px 0; color: #64748b; font-size: 14px; }
          .section { margin-bottom: 25px; }
          .section-title { font-weight: bold; color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; font-size: 16px; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .label { font-weight: 600; color: #475569; }
          .value { color: #0f172a; font-weight: 500; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 30px; font-size: 13px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Prescripción Kinesiológica</h1>
          <p>Código de Verificación: <strong style="color: #0f172a; font-size: 16px;">${p.codigoVerificacion}</strong></p>
          <p>Fecha de Emisión: ${new Date(p.fechaEmision).toLocaleDateString('es-AR')}</p>
        </div>

        <div class="section">
          <div class="section-title">Datos del Paciente</div>
          <div class="row"><span class="label">Nombre:</span> <span class="value">${p.paciente?.name} ${p.paciente?.lastName}</span></div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Profesional</div>
          <div class="row"><span class="label">Nombre:</span> <span class="value">${p.profesional?.name} ${p.profesional?.lastName}</span></div>
          ${p.profesional?.matricula ? `<div class="row"><span class="label">Matrícula:</span> <span class="value">${p.profesional.matricula}</span></div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">Diagnóstico Kinesiológico</div>
          <p class="value">${p.diagnostico}</p>
        </div>

        <div class="section">
          <div class="section-title">Prescripción de Tratamiento</div>
          <p class="value" style="white-space: pre-wrap;">${p.prescripcion}</p>
        </div>

        ${p.indicaciones ? `
        <div class="section">
          <div class="section-title">Indicaciones</div>
          <p class="value">${p.indicaciones}</p>
        </div>` : ''}

        ${p.contraindicaciones ? `
        <div class="section">
          <div class="section-title">Contraindicaciones</div>
          <p class="value" style="color: #dc2626;">${p.contraindicaciones}</p>
        </div>` : ''}

        <div class="section">
          <div class="row">
            <span class="label">Válido hasta:</span> 
            <span class="value">${new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}</span>
          </div>
        </div>

        <div class="alert">
          <strong>Aviso Legal:</strong> Este documento es una prescripción kinesiológica y no reemplaza una receta médica ni órdenes de profesionales médicos. Su validez está sujeta a la normativa vigente del Colegio de Kinesiólogos.
        </div>

        <div class="footer">
          <p>Para verificar la autenticidad de este documento, ingrese el código de verificación en nuestro sistema.</p>
          <p>Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-sky-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mt-40 mx-auto">
        <button
          onClick={() => router.push('/gestion')}
          className="inline-flex  items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-8 group w-fit"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Volver al Panel Principal
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faFilePrescription} className="text-sky-500" />
              Prescripciones Kinesiológicas
            </h1>
            <p className="text-slate-400 text-sm mt-1">Emití prescripciones de tratamiento con código de verificación.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> Nueva Prescripción
          </button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-amber-200 text-sm">
            <strong>Aviso legal:</strong> Estas prescripciones son de carácter kinesiológico y NO reemplazan recetas médicas.
            Su validez está sujeta a la normativa vigente del Colegio de Kinesiólogos de su jurisdicción.
          </p>
        </div>

        {prescripciones.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
            <FontAwesomeIcon icon={faFilePrescription} className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No hay prescripciones emitidas</h3>
            <p className="text-slate-400">Creá tu primera prescripción para comenzar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescripciones.map((p: any) => {
              const estaVencida = p.estado === 'activa' && new Date(p.fechaVencimiento) < new Date();
              const estadoReal = estaVencida ? 'vencida' : p.estado;
              return (
                <div key={p._id} className={`bg-slate-900 border rounded-xl p-5 transition-all hover:border-sky-500/30 ${estadoReal === 'anulada' ? 'border-red-800/50 opacity-60' :
                    estadoReal === 'vencida' ? 'border-amber-800/50' : 'border-slate-800'
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-white">{p.paciente?.name} {p.paciente?.lastName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${estadoReal === 'activa' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            estadoReal === 'vencida' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                          {estadoReal}
                        </span>
                      </div>
                      <p className="text-sm text-sky-400 truncate">{p.diagnostico}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                          {new Date(p.fechaEmision).toLocaleDateString('es-AR')}
                        </span>
                        <span>Vence: {new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}</span>
                        <span className="font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{p.codigoVerificacion}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => copiarCodigo(p.codigoVerificacion)} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition" title="Copiar código">
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                      <button onClick={() => setShowDetail(p)} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition" title="Ver detalle">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faFilePrescription} className="text-sky-500" />
                Emitir Prescripción Kinesiológica
              </h2>
              <button onClick={() => { setShowForm(false); setSearchQuery(''); setPacientesList([]); setShowCreatePatient(false); }} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Paciente *</label>
                {!showCreatePatient ? (
                  <>
                    <div className="relative">
                      <FontAwesomeIcon icon={isSearching ? faSpinner : faSearch} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSearching ? 'text-sky-500 animate-spin' : 'text-slate-500'}`} />
                      <input type="text" value={searchQuery} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" placeholder="Buscar paciente (mín. 2 letras)..." autoComplete="off" />
                    </div>
                    {searchQuery.length >= 2 && (
                      <div className="mt-1 max-h-48 overflow-y-auto border border-slate-700 rounded-lg bg-slate-800 shadow-xl relative z-10">
                        {isSearching ? (
                          <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Buscando...</div>
                        ) : pacientesList.length > 0 ? (
                          pacientesList.map((p: any) => (
                            <button key={p._id} type="button" onClick={() => { setFormData({ ...formData, pacienteId: p._id }); setSearchQuery(`${p.name} ${p.lastName}`); setPacientesList([]); }}
                              className={`w-full text-left px-4 py-3 hover:bg-sky-600/20 transition border-b border-slate-700/50 last:border-0 ${formData.pacienteId === p._id ? 'bg-sky-600/30 text-sky-400' : 'text-slate-300'}`}>
                              <div><span className="font-medium">{p.name} {p.lastName}</span>{p.email && <span className="block text-xs text-slate-500">{p.email}</span>}</div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-slate-500">No se encontraron pacientes con "{searchQuery}"</div>
                        )}
                      </div>
                    )}
                    {formData.pacienteId && !isSearching && pacientesList.length === 0 && (
                      <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-emerald-200 truncate">Paciente: <strong>{searchQuery}</strong></span>
                        </div>
                        <button type="button" onClick={() => { setFormData({ ...formData, pacienteId: '' }); setSearchQuery(''); }} className="flex-shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition" title="Cambiar paciente">
                          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button type="button" onClick={() => setShowCreatePatient(true)} className="w-full mt-3 py-2.5 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-sky-500 hover:bg-sky-500/10 rounded-lg text-sm transition flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faUserPlus} /> ¿No está en la lista? Crear paciente nuevo
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleCreatePatient} className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                      <FontAwesomeIcon icon={faUserPlus} className="text-sky-500" /> Nuevo Paciente
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input required placeholder="Nombre *" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none text-sm" />
                      <input required placeholder="Apellido *" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none text-sm" />
                    </div>
                    <input required type="email" placeholder="Correo electrónico *" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none text-sm" />
                    <input required type="tel" placeholder="Teléfono *" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none text-sm" />
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => { setShowCreatePatient(false); setNewPatient({ name: '', lastName: '', email: '', phone: '' }); }} className="flex-1 px-3 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition text-sm">Volver al buscador</button>
                      <button type="submit" disabled={isCreatingPatient} className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm">
                        {isCreatingPatient ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheckCircle} />} Crear y Seleccionar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Diagnóstico Kinesiológico *</label>
                <input type="text" value={formData.diagnostico} onChange={e => setFormData({ ...formData, diagnostico: e.target.value })} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none" placeholder="Ej: Lumbalgia mecánica, Contractura cervical..." required />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Prescripción de Tratamiento *</label>
                <textarea value={formData.prescripcion} onChange={e => setFormData({ ...formData, prescripcion: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" placeholder="Ej: 10 sesiones de kinesiología motriz, 2 veces por semana. Incluye electroterapia, ejercicios de estabilización lumbar y estiramientos." required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Indicaciones</label>
                  <textarea value={formData.indicaciones} onChange={e => setFormData({ ...formData, indicaciones: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" placeholder="Ej: Aplicar calor local antes de la sesión." />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Contraindicaciones</label>
                  <textarea value={formData.contraindicaciones} onChange={e => setFormData({ ...formData, contraindicaciones: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" placeholder="Ej: No realizar ejercicios de alto impacto." />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Validez (días)</label>
                <select value={formData.diasValidez} onChange={e => setFormData({ ...formData, diasValidez: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-sky-500 focus:outline-none">
                  <option value={15}>15 días</option>
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => { setShowForm(false); setSearchQuery(''); setPacientesList([]); setShowCreatePatient(false); }} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                  {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheckCircle} />} Emitir Prescripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faFilePrescription} className="text-sky-500" />
                Detalle de Prescripción
              </h2>
              <button onClick={() => setShowDetail(null)} className="text-slate-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 text-center">
                <p className="text-xs text-sky-400 uppercase tracking-wider mb-1">Código de Verificación</p>
                <p className="text-2xl font-mono font-bold text-white tracking-widest">{showDetail.codigoVerificacion}</p>
                <button onClick={() => copiarCodigo(showDetail.codigoVerificacion)} className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 mx-auto">
                  <FontAwesomeIcon icon={faCopy} /> Copiar código
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500 text-xs">Paciente</p><p className="text-white font-medium">{showDetail.paciente?.name} {showDetail.paciente?.lastName}</p></div>
                <div><p className="text-slate-500 text-xs">Profesional</p><p className="text-white font-medium">{showDetail.profesional?.name} {showDetail.profesional?.lastName}</p></div>
                <div><p className="text-slate-500 text-xs">Emitida</p><p className="text-white font-medium">{new Date(showDetail.fechaEmision).toLocaleDateString('es-AR')}</p></div>
                <div><p className="text-slate-500 text-xs">Vence</p><p className="text-white font-medium">{new Date(showDetail.fechaVencimiento).toLocaleDateString('es-AR')}</p></div>
              </div>

              <div><p className="text-slate-500 text-xs mb-1">Diagnóstico</p><p className="text-white bg-slate-800 p-3 rounded-lg">{showDetail.diagnostico}</p></div>
              <div><p className="text-slate-500 text-xs mb-1">Prescripción</p><p className="text-white bg-slate-800 p-3 rounded-lg whitespace-pre-wrap">{showDetail.prescripcion}</p></div>
              {showDetail.indicaciones && <div><p className="text-slate-500 text-xs mb-1">Indicaciones</p><p className="text-emerald-300 bg-slate-800 p-3 rounded-lg">{showDetail.indicaciones}</p></div>}
              {showDetail.contraindicaciones && <div><p className="text-slate-500 text-xs mb-1">Contraindicaciones</p><p className="text-red-300 bg-slate-800 p-3 rounded-lg">{showDetail.contraindicaciones}</p></div>}

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200">
                <strong>Aviso:</strong> Esta es una prescripción kinesiológica. No reemplaza recetas médicas ni órdenes de profesionales médicos.
              </div>
            </div>

            {showDetail.estado === 'activa' && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
                {/* ✅ BOTÓN DE IMPRESIÓN / PDF */}
                <button onClick={() => handlePrint(showDetail)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faPrint} /> Imprimir / PDF
                </button>
                <button onClick={() => handleAnular(showDetail._id)} className="flex-1 px-4 py-2.5 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faBan} /> Anular
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}