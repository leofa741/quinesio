// app/propiedades/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaFilter, FaSearch, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';
import { formatARS } from '@/app/lib/formatcurrenci';
import Image from 'next/image';
import { FaArrowLeft, FaBath, FaBed, FaRulerCombined } from 'react-icons/fa6';
import PropertyCard from '../components/public/PropertyCard';

// Reutilizamos los tipos y helpers del Home
type PublicProperty = any; // Importá desde un archivo compartido en producción

const formatPrice = (monto?: number, moneda: 'ARS' | 'USD' = 'USD', tipo: 'venta' | 'alquiler' = 'venta') => {
  if (!monto) return 'Consultar';
  if (moneda === 'ARS') return formatARS(monto);
  return `$ ${monto.toLocaleString('es-AR')} ${moneda}${tipo === 'alquiler' ? '/mes' : ''}`;
};

export default function PropiedadesPublicasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24"><p className="text-slate-400">Cargando...</p></div>}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [propiedades, setPropiedades] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    operacion: searchParams.get('operacion') || '',
    tipo: searchParams.get('tipo') || '',
    categoria: searchParams.get('categoria') || '',
    barrio: searchParams.get('barrio') || '',
    destacado: searchParams.get('destacado') === 'true',
  });

  // 📥 Cargar propiedades con filtros
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filtros.operacion) params.set('operacion', filtros.operacion);
        if (filtros.tipo) params.set('tipo', filtros.tipo);
        if (filtros.categoria) params.set('categoria', filtros.categoria);
        if (filtros.barrio) params.set('barrio', filtros.barrio);
        if (filtros.destacado) params.set('destacado', 'true');
        params.set('limit', '20');
        
        const res = await fetch(`/api/gestion/public/propiedades?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPropiedades(data.propiedades);
        }
      } catch (err) {
        console.error('Error loading properties:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [filtros]);

  // 🔄 Actualizar URL cuando cambian filtros
  const updateFilters = (newFilters: Partial<typeof filtros>) => {
    const updated = { ...filtros, ...newFilters };
    setFiltros(updated);
    
    const params = new URLSearchParams();
    if (updated.operacion) params.set('operacion', updated.operacion);
    if (updated.tipo) params.set('tipo', updated.tipo);
    if (updated.categoria) params.set('categoria', updated.categoria);
    if (updated.barrio) params.set('barrio', updated.barrio);
    if (updated.destacado) params.set('destacado', 'true');
    
    router.push(`/propiedades?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-violet-500 border-r-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24">

      <br /><br />

       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="text-slate-400 hover:text-violet-400 flex items-center gap-2 text-sm">
          <FaArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
      </div>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Propiedades Disponibles</h1>
        <p className="text-slate-400">{propiedades.length} resultados encontrados</p>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900/80 border-b border-slate-700/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4">
            {/* Operación */}
            <select
              value={filtros.operacion}
              onChange={(e) => updateFilters({ operacion: e.target.value })}
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="">Todas las operaciones</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
            </select>
            
            {/* Tipo de propiedad */}
            <select
              value={filtros.tipo}
              onChange={(e) => updateFilters({ tipo: e.target.value })}
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="">Todos los tipos</option>
              <option value="departamento">Departamento</option>
              <option value="casa">Casa</option>
              <option value="local">Local</option>
              <option value="oficina">Oficina</option>
              <option value="terreno">Terreno</option>
            </select>
            
            {/* Categoría */}
            <select
              value={filtros.categoria}
              onChange={(e) => updateFilters({ categoria: e.target.value })}
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="">Todas las categorías</option>
              <option value="residencial">Residencial</option>
              <option value="comercial">Comercial</option>
              <option value="industrial">Industrial</option>
            </select>
            
            {/* Destacadas */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.destacado}
                onChange={(e) => updateFilters({ destacado: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600"
              />
              <span className="text-sm text-slate-300">Solo destacadas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Grid de propiedades */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {propiedades.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FaBuilding className="text-4xl mb-3 mx-auto opacity-50" />
            <p>No se encontraron propiedades con estos filtros</p>
            <button 
              onClick={() => updateFilters({ operacion: '', tipo: '', categoria: '', barrio: '', destacado: false })}
              className="mt-4 text-violet-400 hover:text-violet-300 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propiedades.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
