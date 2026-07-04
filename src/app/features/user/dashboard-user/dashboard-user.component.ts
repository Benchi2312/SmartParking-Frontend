import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Espacio } from '../../../models/espacio.model';
import { CrearReservaRequest, Reserva } from '../../../models/reserva.model';
import { Usuario } from '../../../models/usuario.model';
import { Vehiculo } from '../../../models/vehiculo.model';
import { ErrorMessageService } from '../../../services/error-message.service';
import { EspacioService } from '../../../services/espacio.service';
import { ReservaService } from '../../../services/reserva.service';
import { VehiculoService } from '../../../services/vehiculo.service';
import { ListVehiculosComponent } from '../../vehiculos/list-vehiculos/list-vehiculos.component';
import { AppFooterComponent } from '../../../shared/components/app-footer/app-footer.component';

type UserSection = 'dashboard' | 'vehiculo' | 'espacio' | 'historial';

type ReservaForm = FormGroup<{
  fecha: FormControl<string>;
  vehiculoId: FormControl<number | null>;
  espacioId: FormControl<number | null>;
}>;

@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, ListVehiculosComponent, AppFooterComponent],
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.css']
})
export class DashboardUserComponent implements OnInit, OnDestroy {
  activeSection: UserSection = 'dashboard';
  userName: string = 'Usuario';
  vehiculos: Vehiculo[] = [];
  espacios: Espacio[] = [];
  espaciosDisponibles: Espacio[] = [];
  reservas: Reserva[] = [];
  loading: boolean = false;
  error: string = '';
  reservaSaving: boolean = false;
  reservaSuccess: string = '';
  reservaError: string = '';
  ultimaReserva: Reserva | null = null;
  sidebarOpen = false;

  filterEstado: string = '';
  filterFechaDesde: string = '';
  filterFechaHasta: string = '';

  private destroy$ = new Subject<void>();
  private previousEstado: string | null = null;
  notificacionCambio: boolean = false;

  reservaForm: ReservaForm = new FormGroup({
    fecha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]
    }),
    vehiculoId: new FormControl<number | null>(null, {
      validators: [Validators.required]
    }),
    espacioId: new FormControl<number | null>(null, {
      validators: [Validators.required]
    })
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehiculoService: VehiculoService,
    private espacioService: EspacioService,
    private reservaService: ReservaService,
    private errorMessageService: ErrorMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarUsuario();
    this.cargarDatos();

    this.route.fragment.subscribe((fragment) => {
      this.activeSection = this.mapFragmentToSection(fragment);
    });

    interval(20000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.recargarSilenciosamente();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  setSection(section: UserSection) {
    this.activeSection = section;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    this.router.navigate(['/login']);
  }

  get vehicle(): Vehiculo | null {
    return this.vehiculos[0] ?? null;
  }

  get espaciosAsignados(): Espacio[] {
    return this.espacios.filter((e) => e.estado === 'OCUPADO');
  }

  get vehiculosSinEspacio(): Vehiculo[] {
    const vehiculoIdsConEspacio = new Set(
      this.espaciosAsignados
        .map((e) => e.vehiculo?.id)
        .filter((id): id is number => id != null)
    );
    return this.vehiculos.filter((v) => v.id != null && !vehiculoIdsConEspacio.has(v.id));
  }

  get tieneEspaciosAsignados(): boolean {
    return this.espaciosAsignados.length > 0;
  }

  get tieneVehiculosSinEspacio(): boolean {
    return this.vehiculosSinEspacio.length > 0;
  }

  get parkingSpace(): Espacio | null {
    return this.espaciosAsignados[0] ?? this.espacios[0] ?? null;
  }

  get profileInitials(): string {
    const names = this.userName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 0) {
      return 'U';
    }

    return names.slice(0, 2).map((name) => name[0].toUpperCase()).join('');
  }

  get parkingStatusTone(): 'available' | 'occupied' {
    return this.parkingSpace?.estado === 'OCUPADO' ? 'occupied' : 'available';
  }

  get today(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get sectionTitle(): string {
    switch (this.activeSection) {
      case 'vehiculo':
        return 'Mi Vehiculo';
      case 'espacio':
        return 'Mi Espacio';
      case 'historial':
        return 'Historial';
      default:
        return 'Dashboard';
    }
  }

  get sectionSubtitle(): string {
    switch (this.activeSection) {
      case 'vehiculo':
        return 'Consulta la informacion principal de tu vehiculo registrado.';
      case 'espacio':
        return 'Solicita un espacio disponible o revisa tu asignacion actual.';
      case 'historial':
        return 'Visualiza el historial de tus solicitudes de reserva.';
      default:
        return 'Resumen rapido de tu experiencia dentro del condominio.';
    }
  }

  get tieneEspacioAsignado(): boolean {
    return this.tieneEspaciosAsignados;
  }

  get filteredReservas(): Reserva[] {
    return this.reservas.filter((r) => {
      if (this.filterEstado && r.estado !== this.filterEstado) return false;
      if (this.filterFechaDesde && r.fecha < this.filterFechaDesde) return false;
      if (this.filterFechaHasta && r.fecha > this.filterFechaHasta) return false;
      return true;
    });
  }

  get hayFiltrosActivos(): boolean {
    return !!this.filterEstado || !!this.filterFechaDesde || !!this.filterFechaHasta;
  }

  limpiarFiltros() {
    this.filterEstado = '';
    this.filterFechaDesde = '';
    this.filterFechaHasta = '';
  }

  getEstadoLabel(estado: string | null | undefined): string {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'CONFIRMADA': return 'Confirmada';
      case 'CANCELADA': return 'Cancelada';
      case 'FINALIZADA': return 'Finalizada';
      default: return estado || 'Sin estado';
    }
  }

  get ultimaReservaNotificacion(): { alertClass: string; icon: string; title: string; description: string } | null {
    const r = this.ultimaReserva;
    if (!r) return null;

    switch (r.estado) {
      case 'PENDIENTE':
        return {
          alertClass: 'alert-warning',
          icon: '?',
          title: 'Solicitud en Espera',
          description: 'Tu solicitud para el espacio esta en cola de revision. El administrador validara el acceso pronto.'
        };
      case 'CONFIRMADA':
        return {
          alertClass: 'alert-success',
          icon: '\u2713',
          title: '\u00a1Reserva Aprobada!',
          description: r.espacio
            ? 'Tu reserva para el espacio ' + r.espacio.numero + ' ha sido confirmada. Puedes ocupar tu lugar asignado.'
            : 'Tu reserva ha sido confirmada. Puedes ocupar tu lugar asignado.'
        };
      case 'CANCELADA':
        if (r.canceladoPor === 'USUARIO') {
          return {
            alertClass: 'alert-info',
            icon: 'i',
            title: 'Reserva Cancelada',
            description: 'Has cancelado tu solicitud de estacionamiento correctamente. Si deseas, puedes generar una nueva solicitud.'
          };
        }
        if (r.canceladoPor === 'ADMIN') {
          return {
            alertClass: 'alert-error',
            icon: '!',
            title: 'Solicitud Rechazada',
            description: 'Tu ultima solicitud de estacionamiento fue rechazada por la administracion. Por favor, selecciona otro espacio disponible o ponte en contacto con soporte.'
          };
        }
        return {
          alertClass: 'alert-info',
          icon: 'i',
          title: 'Reserva Cancelada',
          description: 'Esta solicitud fue cancelada.'
        };
      case 'FINALIZADA':
        return {
          alertClass: 'alert-info',
          icon: '\u2713',
          title: 'Vehiculo Liberado',
          description: 'Tu vehiculo ha salido del recinto exitosamente. El espacio quedo libre y ya puedes generar una nueva solicitud.'
        };
      default:
        return null;
    }
  }

  getEstadoClass(estado: string | null | undefined): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge badge-pending';
      case 'CONFIRMADA': return 'badge badge-confirmed';
      case 'CANCELADA': return 'badge badge-rejected';
      case 'FINALIZADA': return 'badge badge-finished';
      default: return 'badge';
    }
  }

  cargarDatos() {
    const usuarioId = this.getUsuarioId();
    this.loading = true;
    this.error = '';

    if (!usuarioId) {
      this.loading = false;
      this.error = 'No se encontro el usuario logueado';
      return;
    }

    forkJoin({
      vehiculos: this.vehiculoService.listarMisVehiculos(),
      reservas: this.reservaService.listarMisReservas(),
      misEspacios: this.espacioService.getMisEspacios(),
      disponibles: this.espacioService.getEspaciosDisponibles(),
      ultimaReserva: this.reservaService.obtenerUltimaReserva()
    }).subscribe({
      next: ({ vehiculos, reservas, misEspacios, disponibles, ultimaReserva }) => {
        this.vehiculos = vehiculos;
        this.reservas = reservas;
        this.previousEstado = this.ultimaReserva?.estado ?? null;
        this.ultimaReserva = ultimaReserva;
        this.espacios = misEspacios;
        this.espaciosDisponibles = disponibles;
        this.preseleccionarVehiculo();
        this.preseleccionarEspacio();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.vehiculos = [];
        this.reservas = [];
        this.espacios = [];
        this.espaciosDisponibles = [];
        this.ultimaReserva = null;
        this.loading = false;
        this.cdr.detectChanges();
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo cargar la informacion del dashboard');
      }
    });
  }

  private recargarSilenciosamente() {
    const usuarioId = this.getUsuarioId();
    if (!usuarioId) return;

    forkJoin({
      reservas: this.reservaService.listarMisReservas(),
      misEspacios: this.espacioService.getMisEspacios(),
      disponibles: this.espacioService.getEspaciosDisponibles(),
      ultimaReserva: this.reservaService.obtenerUltimaReserva()
    }).subscribe({
      next: ({ reservas, misEspacios, disponibles, ultimaReserva }) => {
        const estadoAnterior = this.ultimaReserva?.estado ?? null;
        this.reservas = reservas;
        this.espacios = misEspacios;
        this.espaciosDisponibles = disponibles;
        this.previousEstado = estadoAnterior;
        this.ultimaReserva = ultimaReserva;

        if (estadoAnterior && estadoAnterior !== (ultimaReserva?.estado ?? null)) {
          this.notificacionCambio = true;
          setTimeout(() => this.notificacionCambio = false, 3000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  crearReserva() {
    this.reservaError = '';
    this.reservaSuccess = '';

    if (this.reservaForm.invalid) {
      this.reservaForm.markAllAsTouched();
      return;
    }

    const usuarioId = this.getUsuarioId();

    if (!usuarioId) {
      this.reservaError = 'No se encontro el usuario logueado';
      return;
    }

    const formValue = this.reservaForm.getRawValue();

    if (!formValue.vehiculoId) {
      this.reservaError = 'Selecciona un vehiculo';
      return;
    }

    if (!formValue.espacioId) {
      this.reservaError = 'Selecciona un espacio disponible';
      return;
    }

    if (formValue.fecha < this.today) {
      this.reservaError = 'No se pueden crear reservas con fechas pasadas';
      return;
    }

    const payload: CrearReservaRequest = {
      fecha: formValue.fecha,
      vehiculoId: formValue.vehiculoId,
      espacioId: formValue.espacioId
    };

    this.reservaSaving = true;

    this.reservaService.crearReserva(payload).subscribe({
      next: (reserva) => {
        this.reservaSaving = false;
        this.reservaSuccess = 'Solicitud de reserva enviada correctamente';
        this.reservas = [reserva, ...this.reservas];
        this.cargarDatos();
        this.resetReservaForm();
      },
      error: (err) => {
        this.reservaSaving = false;
        this.reservaError = this.errorMessageService.fromBackend(err, 'No se pudo crear la reserva');
      }
    });
  }

  async cancelarReserva(reserva: Reserva) {
    if (!reserva.id) {
      return;
    }

    const { default: Swal } = await import('sweetalert2');
    const result = await Swal.fire({
      title: 'Cancelar reserva',
      text: `¿Estas seguro de cancelar la reserva del ${reserva.fecha} para el vehiculo ${reserva.vehiculo?.placa || ''}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Si, cancelar',
      cancelButtonText: 'Volver',
      background: '#1e293b',
      color: '#f8fafc'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.reservaService.cancelarReserva(reserva.id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Cancelada',
          text: 'La reserva ha sido cancelada correctamente.',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 2000,
          showConfirmButton: false
        });
        this.cargarDatos();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessageService.fromBackend(err, 'No se pudo cancelar la reserva'),
          background: '#1e293b',
          color: '#f8fafc',
          confirmButtonColor: '#475569',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  }

  hasReservaError(controlName: keyof ReservaForm['controls'], errorName: string): boolean {
    const control = this.reservaForm.controls[controlName];
    return control.hasError(errorName) && (control.touched || control.dirty);
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
    this.userName = usuario?.nombre || usuario?.email || 'Usuario';
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

  private preseleccionarVehiculo() {
    if (this.vehiculosSinEspacio.length > 0 && !this.reservaForm.controls.vehiculoId.value) {
      this.reservaForm.controls.vehiculoId.setValue(this.vehiculosSinEspacio[0].id ?? null);
    }
  }

  private preseleccionarEspacio() {
    if (this.espaciosDisponibles.length > 0 && !this.reservaForm.controls.espacioId.value) {
      this.reservaForm.controls.espacioId.setValue(this.espaciosDisponibles[0].id ?? null);
    }
  }

  private resetReservaForm() {
    this.reservaForm.reset({
      fecha: '',
      vehiculoId: this.vehiculosSinEspacio[0]?.id ?? null,
      espacioId: this.espaciosDisponibles[0]?.id ?? null
    });
  }

  private mapFragmentToSection(fragment: string | null): UserSection {
    if (fragment === 'vehiculo' || fragment === 'espacio' || fragment === 'historial') {
      return fragment;
    }

    return 'dashboard';
  }
}
