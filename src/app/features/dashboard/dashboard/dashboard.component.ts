import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Espacio } from '../../../models/espacio.model';
import { Reserva } from '../../../models/reserva.model';
import { Usuario } from '../../../models/usuario.model';
import { Vehiculo } from '../../../models/vehiculo.model';
import { AuthService } from '../../../services/auth.service';
import { ErrorMessageService } from '../../../services/error-message.service';
import { EspacioService } from '../../../services/espacio.service';
import { ReservaService } from '../../../services/reserva.service';
import { VehiculoService } from '../../../services/vehiculo.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  vehiculosTotal: number = 0;
  usuariosTotal: number = 0;
  espaciosOcupados: number = 0;
  espaciosReservados: number = 0;
  userName: string = 'Administrador';
  vehiculos: Vehiculo[] = [];
  reservas: Reserva[] = [];
  espacios: Espacio[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(
    private router: Router,
    private vehiculoService: VehiculoService,
    private espacioService: EspacioService,
    private reservaService: ReservaService,
    private authService: AuthService,
    private errorMessageService: ErrorMessageService
  ) {}

  ngOnInit() {
    this.cargarUsuario();
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.error = '';

    forkJoin({
      vehiculos: this.vehiculoService.listarVehiculos(),
      reservas: this.reservaService.listarReservas(),
      espacios: this.espacioService.getEspacios(),
      usuarios: this.authService.getUsuarios()
    }).subscribe({
      next: ({ vehiculos, reservas, espacios, usuarios }) => {
        this.vehiculos = vehiculos;
        this.reservas = reservas;
        this.espacios = espacios;
        this.vehiculosTotal = vehiculos.length;
        this.espaciosOcupados = espacios.filter((espacio) => espacio.estado === 'OCUPADO').length;
        this.espaciosReservados = espacios.filter((espacio) => espacio.estado === 'RESERVADO').length;
        this.usuariosTotal = usuarios.length;
        this.loading = false;
      },
      error: (err) => {
        this.vehiculos = [];
        this.reservas = [];
        this.espacios = [];
        this.vehiculosTotal = 0;
        this.espaciosOcupados = 0;
        this.espaciosReservados = 0;
        this.usuariosTotal = 0;
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo cargar la informacion del dashboard');
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    this.router.navigate(['/login']);
  }

  private cargarUsuario() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const usuarioStorage = localStorage.getItem('usuario');

    if (!usuarioStorage) {
      return;
    }

    const usuario = this.parseUsuario(usuarioStorage);
    this.userName = usuario?.nombre || usuario?.email || 'Administrador';
  }

  private getUsuarioId(): number | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const usuarioStorage = localStorage.getItem('usuario');

    if (!usuarioStorage) {
      return null;
    }

    const usuario = this.parseUsuario(usuarioStorage);
    return usuario?.id ?? null;
  }

  private parseUsuario(usuarioStorage: string): Usuario | null {
    try {
      return JSON.parse(usuarioStorage) as Usuario;
    } catch {
      return null;
    }
  }
}
