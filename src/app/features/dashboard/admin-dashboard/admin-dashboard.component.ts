import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Espacio } from '../../../models/espacio.model';
import { Reserva } from '../../../models/reserva.model';
import { AuthService } from '../../../services/auth.service';
import { ErrorMessageService } from '../../../services/error-message.service';
import { EspacioService } from '../../../services/espacio.service';
import { ReservaService } from '../../../services/reserva.service';
import { VehiculoService } from '../../../services/vehiculo.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardContentComponent implements OnInit {
  vehiculosTotal: number = 0;
  usuariosTotal: number = 0;
  espaciosOcupados: number = 0;
  reservasPendientes: number = 0;
  procesandoId: number | null = null;
  pendientes: Reserva[] = [];
  loading: boolean = false;
  error: string = '';
  reservaError: string = '';

  constructor(
    private vehiculoService: VehiculoService,
    private espacioService: EspacioService,
    private reservaService: ReservaService,
    private authService: AuthService,
    private errorMessageService: ErrorMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.error = '';
    this.reservaError = '';

    forkJoin({
      vehiculos: this.vehiculoService.listarVehiculos(),
      pendientes: this.reservaService.listarPendientes(),
      espacios: this.espacioService.getEspacios(),
      usuarios: this.authService.getUsuarios()
    }).subscribe({
      next: ({ vehiculos, pendientes, espacios, usuarios }) => {
        this.pendientes = pendientes;
        this.vehiculosTotal = vehiculos.length;
        this.espaciosOcupados = espacios.filter((esp) => esp.estado === 'OCUPADO').length;
        this.usuariosTotal = usuarios.length;
        this.reservasPendientes = pendientes.length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.pendientes = [];
        this.vehiculosTotal = 0;
        this.espaciosOcupados = 0;
        this.usuariosTotal = 0;
        this.reservasPendientes = 0;
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo cargar la informacion del dashboard');
        this.cdr.detectChanges();
      }
    });
  }

  aprobarReserva(reserva: Reserva) {
    if (!reserva.id || this.procesandoId) { return; }
    this.procesandoId = reserva.id;
    this.reservaError = '';

    this.reservaService.aprobarReserva(reserva.id).subscribe({
      next: () => {
        this.procesandoId = null;
        this.cargarDatos();
      },
      error: (err) => {
        this.procesandoId = null;
        this.reservaError = this.errorMessageService.fromBackend(err, 'No se pudo aprobar la reserva');
      }
    });
  }

  rechazarReserva(reserva: Reserva) {
    if (!reserva.id || this.procesandoId) { return; }
    this.procesandoId = reserva.id;
    this.reservaError = '';

    this.reservaService.rechazarReserva(reserva.id).subscribe({
      next: () => {
        this.procesandoId = null;
        this.cargarDatos();
      },
      error: (err) => {
        this.procesandoId = null;
        this.reservaError = this.errorMessageService.fromBackend(err, 'No se pudo rechazar la reserva');
      }
    });
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'CONFIRMADA': return 'Confirmada';
      case 'CANCELADA': return 'Rechazada';
      default: return estado;
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge badge-pending';
      case 'CONFIRMADA': return 'badge badge-confirmed';
      case 'CANCELADA': return 'badge badge-rejected';
      default: return 'badge';
    }
  }
}
