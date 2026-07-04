import { Vehiculo } from './vehiculo.model';
import { Usuario } from './usuario.model';
import { Espacio } from './espacio.model';

export interface Reserva {
  id: number;
  fecha: string;
  estado: string;
  usuario?: Usuario;
  vehiculo?: Vehiculo;
  espacio?: Espacio;
  canceladoPor?: string | null;
}

export interface CrearReservaRequest {
  fecha: string;
  estado?: string;
  vehiculoId: number;
  espacioId: number;
}
