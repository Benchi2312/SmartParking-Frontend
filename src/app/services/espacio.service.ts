import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CrearEspacioRequest, Espacio } from '../models/espacio.model';

@Injectable({
  providedIn: 'root'
})
export class EspacioService {
  private readonly apiUrl = 'http://localhost:8080/api/espacios';

  constructor(private http: HttpClient) {}

  getEspacios(): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(this.apiUrl);
  }

  getMisEspacios(): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(`${this.apiUrl}/mis-espacios`);
  }

  getEspaciosDisponibles(): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(`${this.apiUrl}/disponibles`);
  }

  crearEspacio(espacio: CrearEspacioRequest): Observable<Espacio> {
    return this.http.post<Espacio>(this.apiUrl, espacio);
  }

  actualizarEspacio(id: number, espacio: CrearEspacioRequest): Observable<Espacio> {
    return this.http.put<Espacio>(`${this.apiUrl}/${id}`, espacio);
  }

  eliminarEspacio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  liberarEspacio(id: number): Observable<Espacio> {
    return this.http.post<Espacio>(`${this.apiUrl}/${id}/liberar`, {});
  }
}
