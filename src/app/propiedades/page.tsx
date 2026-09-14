// app/propiedades/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaFilter, FaSearch, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave,
  FaStar, FaArrowRight, FaBed, FaBath, FaRulerCombined, FaTimes
} from 'react-icons/fa';
import { formatARS } from '@/app/lib/formatcurrenci';
import PropertyCard, { PublicProperty } from '../components/public/PropertyCard';

// ─────────────────────────────────────────────────────────────
// 🔹 Helpers
// ─────────────────────────────────────────────────────────────

const formatPrice = (monto?: number, moneda: 'ARS' | 'USD' = 'USD', tipo: 'venta' | 'alquiler' = 'venta') => {
  if (!monto) return 'Consultar';
  if (moneda === 'ARS') return formatARS(monto);
  const suffix = tipo === 'alquiler' ? '/mes' : '';
  return `$ ${monto.toLocaleString('es-AR')} ${moneda}${suffix}`;
};

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal
// ─────────────────────────────────────────────────────────────

export default function PropiedadesPublicasPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageContent />
    </Suspense>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-violet-500 border-r-purple-500" />
    </div>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [propiedades, setPropiedades] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔹 LEER DIRECTAMENTE DE URL PARAMS (sin estado local)
  // Esto se re-ejecuta en cada render cuando la URL cambia
  const filtros = {
    operacion: searchParams.get('operacion') || '',
    tipo: searchParams.get('tipo') || '',           // ← 'terreno', 'departamento', etc.
    categoria: searchParams.get('categoria') || '', // ← 'residencial', etc.
    barrio: searchParams.get('barrio') || '',
    search: searchParams.get('search') || '',       // ← Búsqueda textual
    destacado: searchParams.get('destacado') === 'true',
  };

  // 📥 Cargar propiedades con filtros
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        // Agregar TODOS los filtros activos
        if (filtros.operacion) params.set('operacion', filtros.operacion);
        if (filtros.tipo) params.set('tipo', filtros.tipo);
        if (filtros.categoria) params.set('categoria', filtros.categoria);
        if (filtros.barrio) params.set('barrio', filtros.barrio);
        if (filtros.search) params.set('search', filtros.search);
        if (filtros.destacado) params.set('destacado', 'true');
        params.set('limit', '20');
        
        const res = await fetch(`/api/gestion/public/propiedades?${params}`);
        
        if (res.ok) {
          const data = await res.json();
          setPropiedades(Array.isArray(data.propiedades) ? data.propiedades : []);
        } else {
          console.error('Error en respuesta:', res.status);
          setPropiedades([]);
        }
      } catch (err) {
        console.error('Error loading properties:', err);
        setPropiedades([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [searchParams]); // ← 🔹 CLAVE: depender de searchParams, no de filtros

  // 🔄 Helper para actualizar URL (sin tocar estado)
  const updateFilters = (newParams: Record<string, string | boolean>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === '' || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    router.push(`/propiedades?${params.toString()}`);
  };

  // 🔹 Limpiar búsqueda
  const clearSearch = () => {
    updateFilters({ search: '' });
  };

  // 🔹 Limpiar todos los filtros
  const clearAllFilters = () => {
    router.push('/propiedades');
  };

  // 🔒 Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-violet-500 border-r-purple-500" />
      </div>
    );
  }

  // 🔒 Validar array
  if (!Array.isArray(propiedades)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24">
        <p className="text-slate-400">Error al cargar propiedades</p>
      </div>
    );
  }

  // 🔹 Detectar si hay filtros activos (para mostrar botón de limpiar)
  const hasActiveFilters = filtros.operacion || filtros.tipo || filtros.categoria || filtros.barrio || filtros.search || filtros.destacado;

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24">
      
      {/* Header con búsqueda activa */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Propiedades Disponibles</h1>
            <p className="text-slate-400">
              {propiedades.length} resultado{propiedades.length !== 1 ? 's' : ''}
              {filtros.search && <span> para "<span className="text-violet-400">{filtros.search}</span>"</span>}
              {filtros.tipo && !filtros.search && <span> de tipo "<span className="text-violet-400">{filtros.tipo}</span>"</span>}
              {filtros.categoria && !filtros.search && !filtros.tipo && <span> categoría "<span className="text-violet-400">{filtros.categoria}</span>"</span>}
            </p>
          </div>
          
          {/* Badge de búsqueda activa con botón de limpiar */}
          {(filtros.search || filtros.tipo || filtros.categoria) && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-all text-sm"
            >
              <FaFilter className="w-4 h-4" />
              <span>
                {filtros.search && `Buscando: "${filtros.search}"`}
                {filtros.tipo && !filtros.search && `Tipo: ${filtros.tipo}`}
                {filtros.categoria && !filtros.search && !filtros.tipo && `Categoría: ${filtros.categoria}`}
              </span>
              <FaTimes className="w-3 h-3 hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900/80 border-b border-slate-700/50 py-4 sticky top-20 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4">
            {/* Operación */}
            <select
              value={filtros.operacion}
              onChange={(e) => updateFilters({ operacion: e.target.value })}
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-violet-500/50 text-sm"
            >
              <option value="">Todas las operaciones</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
            </select>
            
            {/* Tipo de propiedad */}
            <select
              value={filtros.tipo}
              onChange={(e) => updateFilters({ tipo: e.target.value })}
              className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-violet-500/50 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="departamento">Departamento</option>
              <option value="casa">Casa</option>
              <option value="local">Local</option>
              <option value="oficina">Oficina</option>
              <option value="terreno">Terreno</option>
              <option value="cochera">Cochera</option>
            </select>
            
            {/* Barra de búsqueda inline */}
            <div className="relative flex-1 min-w-[200px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={filtros.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Buscar..."
                className="w-full pl-10 pr-8 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 text-sm"
              />
              {filtros.search && (
                <button
                  onClick={() => updateFilters({ search: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
            
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
            <p>
              {filtros.search 
                ? `No se encontraron propiedades para "${filtros.search}"` 
                : filtros.tipo 
                  ? `No se encontraron propiedades de tipo "${filtros.tipo}"`
                  : filtros.categoria
                    ? `No se encontraron propiedades en categoría "${filtros.categoria}"`
                    : 'No se encontraron propiedades con estos filtros'}
            </p>
            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters}
                className="mt-4 text-violet-400 hover:text-violet-300 font-medium"
              >
                Limpiar todos los filtros
              </button>
            )}
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