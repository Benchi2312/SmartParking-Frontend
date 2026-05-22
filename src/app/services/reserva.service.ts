import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CrearReservaRequest, Reserva } from '../models/reserva.model';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private readonly apiUrl = 'http://localhost:8080/api/reservas';

  constructor(private http: HttpClient) {}

  listarReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.apiUrl);
  }

  getReservasByUsuario(usuarioId: number): Observable<Reserva[]> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.get<Reserva[]>(this.apiUrl, { params });
  }

  crearReserva(reserva: CrearReservaRequest): Observable<Reserva> {
    return this.http.post<Reserva>(this.apiUrl, reserva);
  }
}
