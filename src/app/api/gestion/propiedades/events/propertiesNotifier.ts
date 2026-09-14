// app/api/gestion/propiedades/events/propertiesNotifier.ts
import { EventEmitter } from 'events';

export const propertiesEmitter = new EventEmitter();

// Tipos más flexibles y seguros
export type PropertyEvent = 
  | { 
      type: 'propiedad_creada'; 
      data: { 
        id: string; 
        titulo: string; 
        tipoPropiedad: string; 
        tipoOperacion: string;
        [key: string]: any; // Permite propiedades adicionales
      } 
    }
  | { 
      type: 'propiedad_actualizada'; 
      data: { 
        id: string; 
        titulo?: string; 
        estado?: string;
        [key: string]: any;
      } 
    }
  | { 
      type: 'propiedad_eliminada'; 
      data: { 
        id: string; 
        estado?: string; 
        fechaBaja?: Date;
        [key: string]: any;
      } 
    }
  | { 
      type: 'propiedad_estado_cambiado'; 
      data: { 
        id: string; 
        estado: string; 
        anteriorEstado?: string;
        [key: string]: any;
      } 
    };

// Función para notificar eventos a los clientes SSE
export function notifyProperties(event: PropertyEvent) {
  propertiesEmitter.emit('property-event', JSON.stringify(event));
}

// Normalizar propiedad para enviar por SSE (evitar datos sensibles)
export function normalizeProperty(prop: any) {
  const obj = prop.toObject?.() || prop;
  const { notasInternas, visitasProgramadas, __v, ...publicData } = obj;
  
  return {
    ...publicData,
    _id: publicData._id?.toString?.() || publicData._id,
    propietario: typeof publicData.propietario === 'object' 
      ? publicData.propietario 
      : publicData.propietario?.toString?.(),
    agente: typeof publicData.agente === 'object' 
      ? publicData.agente 
      : publicData.agente?.toString?.(),
  };
}