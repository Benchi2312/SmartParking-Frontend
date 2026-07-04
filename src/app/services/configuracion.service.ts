import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private readonly apiUrl = 'http://localhost:8080/api/configuracion';

  constructor(private http: HttpClient) {}

  getTarifa(): Observable<number> {
    return this.http.get<{ tarifaPorHora: number }>(`${this.apiUrl}/tarifa`)
      .pipe(map(res => res.tarifaPorHora));
  }

  actualizarTarifa(tarifa: number): Observable<number> {
    return this.http.put<{ tarifaPorHora: number }>(`${this.apiUrl}/tarifa`, { tarifaPorHora: tarifa })
      .pipe(map(res => res.tarifaPorHora));
  }
}
