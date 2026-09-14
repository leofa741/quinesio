// app/app/gestion/propiedades/editar/[id]/components/ImageGrid.tsx
'use client';

import { useState } from 'react';
import { FaStar, FaRegStar, FaTrash } from 'react-icons/fa';
import { GripVertical, Eye, X } from 'lucide-react';

interface ImageItem {
  url: string;
  descripcion?: string;
  principal?: boolean;
  orden?: number;
  tipo?: 'foto' | 'plano' | 'video_thumbnail';
  file?: File;
}

interface ImageGridProps {
  images: ImageItem[];
  isPreview: boolean;
  onRemove: (index: number) => void;
  onSetPrincipal: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function ImageGrid({ images, isPreview, onRemove, onSetPrincipal, onReorder }: ImageGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    onReorder(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              relative group rounded-xl overflow-hidden border-2 transition-all cursor-move
              ${img.principal 
                ? 'border-amber-500 ring-2 ring-amber-500/30' 
                : 'border-slate-700/50 hover:border-violet-500/50'
              }
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
            `}
          >
            {/* Imagen */}
            <div 
              className="aspect-square bg-slate-800 cursor-pointer"
              onClick={() => setPreviewUrl(img.url)}
            >
              <img 
                src={img.url} 
                alt={img.descripcion || `Imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Overlay de controles */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                {/* Toggle Principal */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSetPrincipal(index); }}
                  className={`p-1.5 rounded-lg transition-all ${
                    img.principal 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-800'
                  }`}
                  title={img.principal ? 'Imagen principal' : 'Marcar como principal'}
                >
                  {img.principal ? <FaStar className="w-3.5 h-3.5" /> : <FaRegStar className="w-3.5 h-3.5" />}
                </button>
                
                {/* Eliminar */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                  className="p-1.5 rounded-lg bg-rose-500/90 text-white hover:bg-rose-600 transition-all"
                  title="Eliminar imagen"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Badge de tipo */}
              {img.tipo && img.tipo !== 'foto' && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/90 text-white">
                  {img.tipo === 'plano' ? '📐' : '🎬'}
                </span>
              )}
              
              {/* Indicador de nuevo */}
              {isPreview && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/90 text-white">
                  Nuevo
                </span>
              )}
            </div>
            
            {/* Handle de reordenamiento */}
            <div className="absolute top-2 left-2 p-1 rounded bg-slate-900/60 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            
            {/* Descripción corta */}
            {img.descripcion && (
              <p className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-[10px] text-white bg-slate-900/80 truncate">
                {img.descripcion}
              </p>
            )}
          </div>
        ))}
      </div>
      
      {/* Modal de preview */}
      {previewUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <img 
            src={previewUrl} 
            alt="Preview"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}