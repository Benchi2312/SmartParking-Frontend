import { Vehiculo } from './vehiculo.model';
import { Usuario } from './usuario.model';

export interface Reserva {
  id: number;
  fecha: string;
  estado: string;
  usuario?: Usuario;
  vehiculo?: Vehiculo;
}

export interface CrearReservaRequest {
  fecha: string;
  estado: string;
  usuarioId: number;
  vehiculoId: number;
}
