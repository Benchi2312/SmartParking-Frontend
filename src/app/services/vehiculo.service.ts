import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CrearVehiculoRequest, Vehiculo } from '../models/vehiculo.model';
@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private readonly apiUrl = 'http://localhost:8080/api/vehiculos';

  constructor(private http: HttpClient) {}

  listarVehiculos(usuarioId?: number): Observable<Vehiculo[]> {
    if (!usuarioId) {
      return this.http.get<Vehiculo[]>(this.apiUrl);
    }

    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.get<Vehiculo[]>(this.apiUrl, { params });
  }

  crearVehiculo(vehiculo: CrearVehiculoRequest): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(this.apiUrl, vehiculo);
  }

  actualizarVehiculo(id: number, vehiculo: CrearVehiculoRequest): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.apiUrl}/${id}`, vehiculo);
  }

  eliminarVehiculo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getVehiculosByUsuario(usuarioId: number): Observable<Vehiculo[]> {
    return this.listarVehiculos(usuarioId);
  }

}
