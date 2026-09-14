// app/components/public/PropertyCard.tsx
'use client';

import Link from 'next/link';
import { FaMapMarkerAlt, FaStar, FaArrowRight, FaBuilding } from 'react-icons/fa';
import AlertButton from '../ui/AlertButton';

// ─────────────────────────────────────────────────────────────
// 🔹 Tipos (copiá los que ya tenés en tu home o importalos)
// ─────────────────────────────────────────────────────────────

export interface PublicProperty {
  _id: string;
  titulo: string;
  tipoPropiedad: 'departamento' | 'casa' | 'local' | 'oficina' | 'terreno' | 'cochera' | 'galpon' | 'ph';
  tipoOperacion: 'venta' | 'alquiler' | 'ambos';
  categoria: 'residencial' | 'comercial' | 'industrial' | 'inversion';
  ubicacion: {
    barrio: string;
    ciudad: string;
    provincia: string;
    zona?: string;
    mostrarExacta: boolean;
    calle?: string;
    numero?: string;
  };
  precio: {
    monto?: number;
    moneda: 'ARS' | 'USD';
    tipo: 'venta' | 'alquiler';
  };
  imagen?: string;
  slug?: string;
  destacado: boolean;
  urgente: boolean;
  caracteristicas?: {
    ambientes?: number;
    dormitorios?: number;
    banios?: number;
    metrosCubiertos?: number;
    cochera?: boolean;
    balcon?: boolean;
    pileta?: boolean;
  };
}

// ─────────────────────────────────────────────────────────────
// 🔹 Helpers internos (no se exportan, solo para uso interno)
// ─────────────────────────────────────────────────────────────

const formatPrice = (monto?: number, moneda: 'ARS' | 'USD' = 'USD', tipo: 'venta' | 'alquiler' = 'venta') => {
  if (!monto) return 'Consultar';
  if (moneda === 'ARS') {
    // Si tenés formatARS en tu lib, usalo: import { formatARS } from '@/app/lib/formatcurrenci';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);
  }
  const suffix = tipo === 'alquiler' ? '/mes' : '';
  return `$ ${monto.toLocaleString('es-AR')} ${moneda}${suffix}`;
};

const getTipoIcon = (tipo: string) => {
  const icons: Record<string, string> = {
    departamento: '🏢', casa: '🏠', local: '🏪', oficina: '🏢',
    terreno: '🌳', cochera: '🚗', galpon: '🏭', ph: '🏘️',
  };
  return icons[tipo] || '🏠';
};

// ─────────────────────────────────────────────────────────────
// 🔹 Props del componente
// ─────────────────────────────────────────────────────────────

export interface PropertyCardProps {
  property: PublicProperty;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
  hrefBase?: string; // Por defecto: '/propiedad'
}

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal
// ─────────────────────────────────────────────────────────────

export default function PropertyCard({ 
  property, 
  variant = 'default',
  className = '',
  hrefBase = '/propiedad'
}: PropertyCardProps) {
  const { titulo, tipoPropiedad, ubicacion, precio, imagen, destacado, urgente, slug, caracteristicas } = property;
  
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';
  
  return (
    <Link 
     href={slug ? `/propiedades/${slug}` : '#'}
      className={`group block bg-slate-900/80 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-900/20 transition-all duration-300 ${className} ${isFeatured ? 'ring-2 ring-violet-500/30' : ''}`}
    >
      {/* Imagen */}
      <div className={`relative ${isCompact ? 'aspect-[3/2]' : 'aspect-[4/3]'} overflow-hidden`}>
        {imagen ? (
          <img 
            src={imagen} 
            alt={titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
            <FaBuilding className="w-12 h-12 opacity-50" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {destacado && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-xs font-medium flex items-center gap-1">
              <FaStar className="w-3 h-3" /> Destacada
            </span>
          )}
          {urgente && (
            <span className="px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-xs font-medium">
              Urgente
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-slate-900/90 text-slate-300 text-xs font-medium capitalize flex items-center gap-1">
            <span>{getTipoIcon(tipoPropiedad)}</span> {tipoPropiedad}
          </span>
        </div>
        
        {/* Precio badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-sm">
          <p className="text-white font-bold text-sm">
            {formatPrice(precio.monto, precio.moneda, precio.tipo)}
          </p>
          <p className="text-slate-400 text-[10px] uppercase">
            {precio.tipo === 'alquiler' ? '/mes' : ''}
          </p>
        </div>
      </div>
      
      {/* Contenido */}
      <div className={`p-${isCompact ? '4' : '5'}`}>
        <h3 className={`text-white font-semibold ${isCompact ? 'text-base' : 'text-lg'} mb-2 line-clamp-1 group-hover:text-violet-400 transition-colors`}>
          {titulo}
        </h3>
        
        {/* Ubicación */}
        <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-3">
          <FaMapMarkerAlt className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <span className="truncate">{ubicacion.barrio}, {ubicacion.ciudad}</span>
        </div>


        
        
        {/* Características - Solo en variante default */}
        {!isCompact && caracteristicas && (
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
            {caracteristicas.ambientes && <span>{caracteristicas.ambientes} amb.</span>}
            {caracteristicas.dormitorios && <span>{caracteristicas.dormitorios} dorm.</span>}
            {caracteristicas.banios && <span>{caracteristicas.banios} baños</span>}
            {caracteristicas.metrosCubiertos && <span>{caracteristicas.metrosCubiertos} m²</span>}
          </div>
        )}


        
        {/* Footer */}
        <div className={`flex items-center justify-between pt-${isCompact ? '3' : '4'} border-t border-slate-700/50`}>
          <span className="text-violet-400 text-sm font-medium group-hover:underline">
            {isCompact ? 'Ver' : 'Ver detalles'}
          </span>
          <FaArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
        </div>



      </div>
    </Link>
  );
}