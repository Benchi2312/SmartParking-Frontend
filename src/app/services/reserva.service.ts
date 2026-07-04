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

  listarMisReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/mis-reservas`);
  }

  listarPendientes(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/pendientes`);
  }

  getReservasByUsuario(usuarioId: number): Observable<Reserva[]> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.get<Reserva[]>(this.apiUrl, { params });
  }

  crearReserva(reserva: CrearReservaRequest): Observable<Reserva> {
    return this.http.post<Reserva>(this.apiUrl, reserva);
  }

  cambiarEstadoReserva(id: number, estado: 'CONFIRMADA' | 'CANCELADA'): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  obtenerUltimaReserva(): Observable<Reserva | null> {
    return this.http.get<Reserva | null>(`${this.apiUrl}/mis-reservas/ultima`);
  }

  aprobarReserva(id: number): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  rechazarReserva(id: number): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.apiUrl}/${id}/rechazar`, {});
  }

  cancelarReserva(id: number): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}
