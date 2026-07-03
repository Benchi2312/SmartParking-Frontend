import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Espacio } from '../../../models/espacio.model';
import { CrearReservaRequest, Reserva } from '../../../models/reserva.model';
import { Usuario } from '../../../models/usuario.model';
import { Vehiculo } from '../../../models/vehiculo.model';
import { ErrorMessageService } from '../../../services/error-message.service';
import { EspacioService } from '../../../services/espacio.service';
import { ReservaService } from '../../../services/reserva.service';
import { VehiculoService } from '../../../services/vehiculo.service';
import { ListVehiculosComponent } from '../../vehiculos/list-vehiculos/list-vehiculos.component';

type UserSection = 'dashboard' | 'vehiculo' | 'espacio' | 'historial';

type ReservaForm = FormGroup<{
  fecha: FormControl<string>;
  vehiculoId: FormControl<number | null>;
  espacioId: FormControl<number | null>;
}>;

@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ListVehiculosComponent],
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.css']
})
export class DashboardUserComponent implements OnInit {
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
    private errorMessageService: ErrorMessageService
  ) {}

  ngOnInit() {
    this.cargarUsuario();
    this.cargarDatos();

    this.route.fragment.subscribe((fragment) => {
      this.activeSection = this.mapFragmentToSection(fragment);
    });
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
      vehiculos: this.vehiculoService.listarVehiculos(usuarioId),
      reservas: this.reservaService.listarMisReservas(),
      espacios: this.espacioService.getEspacios(),
      disponibles: this.espacioService.getEspaciosDisponibles(),
      ultimaReserva: this.reservaService.obtenerUltimaReserva()
    }).subscribe({
      next: ({ vehiculos, reservas, espacios, disponibles, ultimaReserva }) => {
        this.vehiculos = vehiculos;
        this.reservas = reservas;
        this.ultimaReserva = ultimaReserva;
        const vehiculoIds = new Set(vehiculos.map((vehiculo) => vehiculo.id).filter(Boolean));
        this.espacios = espacios.filter((espacio) => espacio.vehiculo?.id && vehiculoIds.has(espacio.vehiculo.id));
        this.espaciosDisponibles = disponibles;
        this.preseleccionarVehiculo();
        this.preseleccionarEspacio();
        this.loading = false;
      },
      error: (err) => {
        this.vehiculos = [];
        this.reservas = [];
        this.espacios = [];
        this.espaciosDisponibles = [];
        this.ultimaReserva = null;
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo cargar la informacion del dashboard');
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
