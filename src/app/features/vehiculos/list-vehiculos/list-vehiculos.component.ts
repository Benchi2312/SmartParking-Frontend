import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CrearVehiculoRequest, Vehiculo } from '../../../models/vehiculo.model';
import { Usuario } from '../../../models/usuario.model';
import { ErrorMessageService } from '../../../services/error-message.service';
import { VehiculoService } from '../../../services/vehiculo.service';

type VehiculoForm = FormGroup<{
  placa: FormControl<string>;
  marca: FormControl<string>;
  modelo: FormControl<string>;
}>;

@Component({
  selector: 'app-list-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './list-vehiculos.component.html',
  styleUrls: ['./list-vehiculos.component.css']
})
export class ListVehiculosComponent implements OnInit {
  @Output() vehiculosChanged = new EventEmitter<void>();

  vehiculos: Vehiculo[] = [];
  mostrarModal: boolean = false;
  vehiculoPendienteEliminar: Vehiculo | null = null;
  vehiculoEditando: Vehiculo | null = null;
  loading: boolean = false;
  saving: boolean = false;
  deletingId: number | null = null;
  error: string = '';
  success: string = '';
  isAdmin: boolean = false;

  vehiculoForm: VehiculoForm = new FormGroup({
    placa: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[A-Za-z]{3}-\d{3}$|^[A-Za-z]{2}-\d{4}$/)
      ]
    }),
    marca: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    modelo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    })
  });

  constructor(
    private vehiculoService: VehiculoService,
    private errorMessageService: ErrorMessageService
  ) {}

  get modalTitle(): string {
    return this.vehiculoEditando ? 'Editar Vehiculo' : 'Nuevo Vehiculo';
  }

  get submitText(): string {
    if (this.saving) {
      return 'Guardando...';
    }

    return this.vehiculoEditando ? 'Actualizar' : 'Guardar';
  }

  ngOnInit() {
    this.isAdmin = this.getRol() === 'ADMIN';
    this.cargarVehiculos();
  }

  abrirModal() {
    if (this.isAdmin) {
      return;
    }

    this.vehiculoEditando = null;
    this.mostrarModal = true;
    this.error = '';
    this.success = '';
    this.vehiculoForm.reset();
  }

  abrirModalEditar(vehiculo: Vehiculo) {
    if (this.isAdmin) {
      return;
    }

    this.vehiculoEditando = vehiculo;
    this.mostrarModal = true;
    this.error = '';
    this.success = '';
    this.vehiculoForm.setValue({
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo
    });
  }

  cerrarModal() {
    if (this.saving) {
      return;
    }

    this.mostrarModal = false;
    this.reset();
  }

  guardar() {
    this.error = '';
    this.success = '';

    if (this.vehiculoForm.invalid) {
      this.vehiculoForm.markAllAsTouched();
      return;
    }

    const usuarioId = this.getUsuarioId();

    if (!usuarioId) {
      this.error = 'No se encontro el usuario logueado';
      return;
    }

    const formValue = this.vehiculoForm.getRawValue();
    const payload: CrearVehiculoRequest = {
      placa: formValue.placa.trim().toUpperCase(),
      marca: formValue.marca.trim(),
      modelo: formValue.modelo.trim()
    };

    this.saving = true;

    const request$ = this.vehiculoEditando?.id
      ? this.vehiculoService.actualizarVehiculo(this.vehiculoEditando.id, payload)
      : this.vehiculoService.crearVehiculo(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.success = this.vehiculoEditando
          ? 'Vehiculo actualizado correctamente'
          : 'Vehiculo registrado correctamente';
        this.cerrarModal();
        this.cargarVehiculos(true);
      },
      error: (err) => {
        this.saving = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo registrar el vehiculo');
      }
    });
  }

  eliminar(vehiculo: Vehiculo) {
    if (!vehiculo.id || this.deletingId) {
      return;
    }

    this.vehiculoPendienteEliminar = vehiculo;
  }

  cancelarEliminacion() {
    if (this.deletingId) {
      return;
    }

    this.vehiculoPendienteEliminar = null;
  }

  confirmarEliminacion() {
    const vehiculo = this.vehiculoPendienteEliminar;

    if (!vehiculo?.id || this.deletingId) {
      return;
    }

    this.error = '';
    this.success = '';
    this.deletingId = vehiculo.id;

    this.vehiculoService.eliminarVehiculo(vehiculo.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.vehiculoPendienteEliminar = null;
        this.success = 'Vehiculo eliminado correctamente';
        this.cargarVehiculos(true);
      },
      error: (err) => {
        this.deletingId = null;
        this.vehiculoPendienteEliminar = null;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo eliminar el vehiculo');
      }
    });
  }

  estaEliminando(vehiculo: Vehiculo): boolean {
    return !!vehiculo.id && this.deletingId === vehiculo.id;
  }

  accionesDeshabilitadas(vehiculo: Vehiculo): boolean {
    return this.saving || this.estaEliminando(vehiculo);
  }

  textoEliminar(vehiculo: Vehiculo): string {
    return this.estaEliminando(vehiculo) ? 'Eliminando...' : 'Eliminar';
  }

  cargarVehiculos(notificarCambio: boolean = false) {
    const usuarioId = this.getUsuarioId();

    if (!this.isAdmin && !usuarioId) {
      this.vehiculos = [];
      this.error = 'No se encontro el usuario logueado';
      return;
    }

    this.loading = true;
    this.error = '';

    this.vehiculoService.listarVehiculos(this.isAdmin ? undefined : usuarioId ?? undefined).subscribe({
      next: (vehiculos) => {
        this.vehiculos = vehiculos;
        this.loading = false;
        if (notificarCambio) {
          this.vehiculosChanged.emit();
        }
      },
      error: (err) => {
        this.vehiculos = [];
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudieron cargar los vehiculos');
      }
    });
  }

  hasError(controlName: keyof VehiculoForm['controls'], errorName: string): boolean {
    const control = this.vehiculoForm.controls[controlName];
    return control.hasError(errorName) && (control.touched || control.dirty);
  }

  reset() {
    this.vehiculoForm.reset();
    this.vehiculoEditando = null;
  }

  private getUsuarioId(): number | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const usuarioStorage = localStorage.getItem('usuario');

    if (!usuarioStorage) {
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioStorage) as Usuario;
      return usuario.id ?? null;
    } catch {
      return null;
    }
  }

  private getRol(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem('rol');
  }
}
