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
  estado: FormControl<string>;
  vehiculoId: FormControl<number | null>;
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
  reservas: Reserva[] = [];
  loading: boolean = false;
  error: string = '';
  reservaSaving: boolean = false;
  reservaSuccess: string = '';
  reservaError: string = '';

  reservaForm: ReservaForm = new FormGroup({
    fecha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]
    }),
    estado: new FormControl('PENDIENTE', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    vehiculoId: new FormControl<number | null>(null, {
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

  get parkingSpace(): Espacio | null {
    return this.espacios[0] ?? null;
  }

  get profileInitials(): string {
    const names = this.userName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 0) {
      return 'U';
    }

    return names.slice(0, 2).map((name) => name[0].toUpperCase()).join('');
  }

  get parkingStatusTone(): 'available' | 'occupied' {
    return this.parkingSpace?.estado === 'LIBRE' ? 'available' : 'occupied';
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
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
        return 'Revisa el estado de los espacios de estacionamiento.';
      case 'historial':
        return 'Visualiza tus reservas registradas.';
      default:
        return 'Resumen rapido de tu experiencia dentro del condominio.';
    }
  }

  private cargarDatos() {
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
      reservas: this.reservaService.getReservasByUsuario(usuarioId),
      espacios: this.espacioService.getEspacios()
    }).subscribe({
      next: ({ vehiculos, reservas, espacios }) => {
        this.vehiculos = vehiculos;
        this.reservas = reservas;
        const vehiculoIds = new Set(vehiculos.map((vehiculo) => vehiculo.id).filter(Boolean));
        this.espacios = espacios.filter((espacio) => espacio.vehiculo?.id && vehiculoIds.has(espacio.vehiculo.id));
        this.preseleccionarVehiculo();
        this.loading = false;
      },
      error: (err) => {
        this.vehiculos = [];
        this.reservas = [];
        this.espacios = [];
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

    const payload: CrearReservaRequest = {
      fecha: formValue.fecha,
      estado: formValue.estado,
      usuarioId,
      vehiculoId: formValue.vehiculoId
    };

    this.reservaSaving = true;

    this.reservaService.crearReserva(payload).subscribe({
      next: (reserva) => {
        this.reservaSaving = false;
        this.reservaSuccess = 'Reserva creada correctamente';
        this.reservas = [reserva, ...this.reservas];
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
    if (this.vehiculos.length > 0 && !this.reservaForm.controls.vehiculoId.value) {
      this.reservaForm.controls.vehiculoId.setValue(this.vehiculos[0].id ?? null);
    }
  }

  private resetReservaForm() {
    this.reservaForm.reset({
      fecha: '',
      estado: 'PENDIENTE',
      vehiculoId: this.vehiculos[0]?.id ?? null
    });
  }

  private mapFragmentToSection(fragment: string | null): UserSection {
    if (fragment === 'vehiculo' || fragment === 'espacio' || fragment === 'historial') {
      return fragment;
    }

    return 'dashboard';
  }
}
