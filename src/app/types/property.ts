// app/types/property.ts

export type TipoPropiedad = 
  | 'departamento'
  | 'casa'
  | 'local'
  | 'oficina'
  | 'terreno'
  | 'cochera'
  | 'galpon'
  | 'ph'
  | 'campo'
  | 'barrio cerrado'
  | 'urbanizacion protegida';
export type TipoOperacion = 'venta' | 'alquiler' | 'ambos';
export type CategoriaPropiedad = 'residencial' | 'comercial' | 'industrial' | 'inversion';
export type EstadoPropiedad = 'borrador' | 'publicado' | 'reservado' | 'alquilado' | 'vendido' | 'baja';
export type TipoImagen = 'foto' | 'plano' | 'video_thumbnail';
export type Moneda = 'ARS' | 'USD';

export interface ImagenProperty {
  url: string;
  descripcion?: string;
  principal: boolean;
  orden: number;
  tipo: TipoImagen;
  _id?: string;
}

export interface DireccionProperty {
  calle: string;
  numero: string;
  piso?: string;
  depto?: string;
  barrio: string;
  ciudad: string;
  provincia: string;
  codigoPostal?: string;
  coordenadas?: { lat: number; lng: number };
  mostrarDireccionExacta: boolean;
}

export interface CaracteristicasProperty {
  ambientes?: number;
  dormitorios?: number;
  banios?: number;
  toilets?: number;
  cochera?: boolean;
  cocheras?: number;
  metrosCubiertos?: number;
  metrosTotales?: number;
  metrosTerreno?: number;
  piso?: number;
  orientacion?: string;
  antiguedad?: number;
  estadoConservacion?: 'nuevo' | 'excelente' | 'bueno' | 'regular' | 'a renovar';
  balcon?: boolean;
  terraza?: boolean;
  patio?: boolean;
  pileta?: boolean;
  jardin?: boolean;
  ascensor?: boolean;
  seguridad?: boolean;
}

export interface PreciosProperty {
  venta?: { moneda: Moneda; monto?: number; comision?: number; gastosEscrituracion?: boolean };
  alquiler?: { moneda: Moneda; monto?: number; comision?: number; ajuste?: string; garantiaRequerida?: string };
  expensas?: number;
  impuestos?: number;
}