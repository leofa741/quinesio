'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, faPlus, faFilter, faDownload, faClock, faUser, faCalendarDay, faSpinner, 
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import Link from 'next/link';


interface Actividad {
  _id: string;
  profesionalNombre: string;
  pacienteNombre: string;
  fecha: string;
  duracionMinutos: number;
  tipoSesion: string;
  estado: string;
  notas?: string;
}

export default function SeguimientoActividadesPage() {
  const router = useRouter();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActividades();
  }, []);

  const fetchActividades = async () => {
    try {
      const res = await fetch('/api/gestion/actividades');
      if (res.ok) {
        const data = await res.json();
        setActividades(data);
      }
    } catch (error) {
      console.error('Error al cargar actividades:', error);
    } finally {
      setLoading(false);
    }
  };


  const totalMinutos = actividades.reduce((acc, curr) => acc + curr.duracionMinutos, 0);
  const totalHoras = (totalMinutos / 60).toFixed(1);

  // ✅ FUNCIÓN DE EXPORTACIÓN A EXCEL (CSV con soporte UTF-8)
  const handleExportarExcel = () => {
    if (actividades.length === 0) {
      Swal.fire('Sin datos', 'No hay actividades registradas para exportar.', 'info');
      return;
    }

    // 1. Definimos los encabezados
    const headers = ['Fecha', 'Profesional', 'Paciente', 'Tipo de Sesión', 'Duración (min)', 'Horas', 'Estado', 'Notas'];
    
    // 2. Mapeamos los datos al formato CSV
    const csvRows = actividades.map(act => {
      const fecha = new Date(act.fecha).toLocaleDateString('es-AR');
      const horas = (act.duracionMinutos / 60).toFixed(2);
      // Escapamos comillas dobles por si hay notas con comillas
      const notas = (act.notas || '').replace(/"/g, '""'); 
      
      return [
        fecha,
        `"${act.profesionalNombre}"`,
        `"${act.pacienteNombre}"`,
        `"${act.tipoSesion}"`,
        act.duracionMinutos,
        horas,
        act.estado,
        `"${notas}"`
      ].join(',');
    });

    // 3. Unimos todo con saltos de línea
    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n');

    // 4. Agregamos BOM (Byte Order Mark) para que Excel reconozca tildes y ñ
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 5. Creamos el enlace temporal y forzamos la descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Seguimiento_Actividades_${fechaHoy}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: '¡Exportado!',
      text: 'El archivo se descargó correctamente. Ábrelo con Excel.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto mt-40">

              <Link href="/gestion" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-4 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Volver al Panel
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FontAwesomeIcon icon={faClipboardList} className="text-sky-400" />
              Seguimiento de Actividades
            </h1>
            <p className="text-slate-400 mt-1">Control de sesiones, pacientes atendidos y acumulado de horas laborales.</p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all text-sm font-medium">
              <FontAwesomeIcon icon={faFilter} /> Filtrar
            </button>
            <button 
              onClick={() => router.push('/admin/seguimiento-actividades/nuevo')}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all text-sm font-medium"
            >
              <FontAwesomeIcon icon={faPlus} /> Registrar Actividad
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
              <FontAwesomeIcon icon={faClock} className="text-xl" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Horas Totales Registradas</p>
              <p className="text-2xl font-bold text-white">{totalHoras} hs</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FontAwesomeIcon icon={faUser} className="text-xl" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Sesiones Totales</p>
              <p className="text-2xl font-bold text-white">{actividades.length}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <FontAwesomeIcon icon={faCalendarDay} className="text-xl" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Promedio por Sesión</p>
              <p className="text-2xl font-bold text-white">
                {actividades.length > 0 ? Math.round(totalMinutos / actividades.length) : 0} min
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Profesional</th>
                  <th className="px-6 py-4 font-semibold">Paciente</th>
                  <th className="px-6 py-4 font-semibold">Tipo de Sesión</th>
                  <th className="px-6 py-4 font-semibold text-center">Duración</th>
                  <th className="px-6 py-4 font-semibold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {actividades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No hay actividades registradas aún. ¡Registra la primera!
                    </td>
                  </tr>
                ) : (
                  actividades.map((act) => (
                    <tr key={act._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {new Date(act.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-white font-medium text-sm">{act.profesionalNombre}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{act.pacienteNombre}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-sky-300">
                          {act.tipoSesion}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-300 text-sm font-mono">{act.duracionMinutos} min</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {act.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/30 flex justify-between items-center">
            <span className="text-slate-400 text-sm">Mostrando {actividades.length} registros</span>
            
            {/* ✅ BOTÓN FUNCIONAL DE EXPORTAR */}
            <button 
              onClick={handleExportarExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
            >
              <FontAwesomeIcon icon={faDownload} /> Exportar a Excel (.csv)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}