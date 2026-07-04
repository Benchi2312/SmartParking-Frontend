import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { Espacio } from '../../../models/espacio.model';
import { Reserva } from '../../../models/reserva.model';
import { AuthService } from '../../../services/auth.service';
import { ErrorMessageService } from '../../../services/error-message.service';
import { EspacioService } from '../../../services/espacio.service';
import { ReservaService } from '../../../services/reserva.service';
import { VehiculoService } from '../../../services/vehiculo.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardContentComponent implements OnInit, AfterViewInit {
  vehiculosTotal: number = 0;
  usuariosTotal: number = 0;
  espaciosOcupados: number = 0;
  reservasPendientes: number = 0;
  procesandoId: number | null = null;
  pendientes: Reserva[] = [];
  loading: boolean = false;
  error: string = '';
  reservaError: string = '';

  espacios: Espacio[] = [];
  reservas: Reserva[] = [];

  @ViewChild('donaCanvas') donaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barraCanvas') barraCanvas!: ElementRef<HTMLCanvasElement>;
  private donaChart: Chart | null = null;
  private barraChart: Chart | null = null;
  private isBrowser: boolean;

  constructor(
    private vehiculoService: VehiculoService,
    private espacioService: EspacioService,
    private reservaService: ReservaService,
    private authService: AuthService,
    private errorMessageService: ErrorMessageService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.cargarDatos();
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.crearGraficos();
    }
  }

  cargarDatos() {
    this.loading = true;
    this.error = '';
    this.reservaError = '';

    forkJoin({
      vehiculos: this.vehiculoService.listarVehiculos(),
      pendientes: this.reservaService.listarPendientes(),
      espacios: this.espacioService.getEspacios(),
      usuarios: this.authService.getUsuarios(),
      reservas: this.reservaService.listarReservas()
    }).subscribe({
      next: ({ vehiculos, pendientes, espacios, usuarios, reservas }) => {
        this.pendientes = pendientes;
        this.vehiculosTotal = vehiculos.length;
        this.espaciosOcupados = espacios.filter((esp) => esp.estado === 'OCUPADO').length;
        this.usuariosTotal = usuarios.length;
        this.reservasPendientes = pendientes.length;
        this.espacios = espacios;
        this.reservas = reservas;
        this.loading = false;
        this.cdr.detectChanges();
        this.actualizarGraficos();
      },
      error: (err) => {
        this.pendientes = [];
        this.vehiculosTotal = 0;
        this.espaciosOcupados = 0;
        this.usuariosTotal = 0;
        this.reservasPendientes = 0;
        this.espacios = [];
        this.reservas = [];
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo cargar la informacion del dashboard');
        this.cdr.detectChanges();
      }
    });
  }

  private crearGraficos() {
    this.donaChart = new Chart(this.donaCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['LIBRE', 'OCUPADO'],
        datasets: [{
          data: [0, 0],
          backgroundColor: ['#10b981', '#f59e0b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.6,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
        }
      }
    });

    this.barraChart = new Chart(this.barraCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#6366f1'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.6,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private actualizarGraficos() {
    if (!this.donaChart || !this.barraChart) { return; }

    const libres = this.espacios.filter((e) => e.estado === 'LIBRE').length;
    const ocupados = this.espacios.filter((e) => e.estado === 'OCUPADO').length;

    this.donaChart.data.datasets[0].data = [libres, ocupados];
    this.donaChart.update();

    const pendientes = this.reservas.filter((r) => r.estado === 'PENDIENTE').length;
    const confirmadas = this.reservas.filter((r) => r.estado === 'CONFIRMADA').length;
    const canceladas = this.reservas.filter((r) => r.estado === 'CANCELADA').length;
    const finalizadas = this.reservas.filter((r) => r.estado === 'FINALIZADA').length;

    this.barraChart.data.datasets[0].data = [pendientes, confirmadas, canceladas, finalizadas];
    this.barraChart.update();
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
