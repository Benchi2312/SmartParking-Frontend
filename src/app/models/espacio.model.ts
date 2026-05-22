import { Vehiculo } from './vehiculo.model';

export type EstadoEspacio = 'LIBRE' | 'OCUPADO' | 'RESERVADO';

export interface Espacio {
  id: number;
  numero: string;
  estado: EstadoEspacio;
  vehiculo?: Vehiculo | null;
}

export interface CrearEspacioRequest {
  numero: string;
  estado: EstadoEspacio;
  vehiculoId?: number | null;
}
