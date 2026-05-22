export interface Vehiculo {
  id?: number;
  placa: string;
  marca: string;
  modelo: string;
  usuarioId?: number;
  usuarioNombre?: string;
  usuarioEmail?: string;
}

export interface CrearVehiculoRequest {
  placa: string;
  marca: string;
  modelo: string;
  usuarioId?: number;
}
