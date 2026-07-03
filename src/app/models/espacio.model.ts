import { Usuario } from './usuario.model';
import { Vehiculo } from './vehiculo.model';

export type EstadoEspacio = 'LIBRE' | 'OCUPADO';

export interface Espacio {
  id: number;
  numero: string;
  estado: EstadoEspacio;
  vehiculo?: Vehiculo | null;
  usuario?: Usuario | null;
}

export interface CrearEspacioRequest {
  numero: string;
  estado: EstadoEspacio;
  vehiculoId?: number | null;
}
