'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPerson, faShoePrints, faHand, faBone, 
  faHeadSideVirus, faPersonWalking, faWandMagicSparkles
} from '@fortawesome/free-solid-svg-icons';
import { plantillasClinicas, PlantillaClinica } from '@/app/lib/plantillasClinicas';

interface PlantillasClinicasProps {
  onSelect: (plantilla: PlantillaClinica) => void;
}

export default function PlantillasClinicas({ onSelect }: PlantillasClinicasProps) {
  const iconos: any = {
    'fa-person': faPerson,
    'fa-shoe-prints': faShoePrints,
    'fa-hand': faHand,
    'fa-bone': faBone,
    'fa-head-side-virus': faHeadSideVirus,
    'fa-person-walking': faPersonWalking,
  };

  const colores: any = {
    sky: 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20',
    violet: 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20',
    teal: 'bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20',
  };

  return (
    <div className="mb-4">
      <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
        <FontAwesomeIcon icon={faWandMagicSparkles} className="text-sky-400" />
        Plantillas Rápidas (haz clic para autocompletar)
      </label>
      <div className="flex flex-wrap gap-2">
        {plantillasClinicas.map((plantilla) => (
          <button
            key={plantilla.id}
            type="button"
            onClick={() => onSelect(plantilla)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${colores[plantilla.color]}`}
          >
            <FontAwesomeIcon icon={iconos[plantilla.icono]} className="w-3 h-3" />
            {plantilla.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}