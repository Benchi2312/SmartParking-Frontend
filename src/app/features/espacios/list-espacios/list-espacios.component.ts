import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { CrearEspacioRequest, Espacio, EstadoEspacio } from '../../../models/espacio.model';
import { Vehiculo } from '../../../models/vehiculo.model';
import { ErrorMessageService } from '../../../services/error-message.service';
import { EspacioService } from '../../../services/espacio.service';
import { VehiculoService } from '../../../services/vehiculo.service';

type EspacioForm = FormGroup<{
  numero: FormControl<string>;
  estado: FormControl<EstadoEspacio>;
  vehiculoId: FormControl<number | null>;
}>;

@Component({
  selector: 'app-list-espacios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './list-espacios.component.html',
  styleUrls: ['./list-espacios.component.css']
})
export class ListEspaciosComponent implements OnInit {
  espacios: Espacio[] = [];
  vehiculos: Vehiculo[] = [];
  mostrarModal: boolean = false;
  espacioPendienteEliminar: Espacio | null = null;
  espacioEditando: Espacio | null = null;
  loading: boolean = false;
  saving: boolean = false;
  deletingId: number | null = null;
  error: string = '';
  success: string = '';

  espacioForm: EspacioForm = new FormGroup({
    numero: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{1,10}$/)]
    }),
    estado: new FormControl<EstadoEspacio>('LIBRE', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    vehiculoId: new FormControl<number | null>(null)
  });

  constructor(
    private espacioService: EspacioService,
    private vehiculoService: VehiculoService,
    private errorMessageService: ErrorMessageService
  ) {}

  get modalTitle(): string {
    return this.espacioEditando ? 'Editar Espacio' : 'Nuevo Espacio';
  }

  get submitText(): string {
    if (this.saving) {
      return 'Guardando...';
    }

    return this.espacioEditando ? 'Actualizar' : 'Guardar';
  }

  ngOnInit() {
    this.cargarDatos();

    this.espacioForm.controls.estado.valueChanges.subscribe((estado) => {
      if (estado === 'LIBRE') {
        this.espacioForm.controls.vehiculoId.setValue(null);
      }
    });
  }

  abrirModal() {
    this.espacioEditando = null;
    this.mostrarModal = true;
    this.error = '';
    this.success = '';
    this.espacioForm.reset({
      numero: '',
      estado: 'LIBRE',
      vehiculoId: null
    });
  }

  abrirModalEditar(espacio: Espacio) {
    this.espacioEditando = espacio;
    this.mostrarModal = true;
    this.error = '';
    this.success = '';
    this.espacioForm.setValue({
      numero: espacio.numero,
      estado: espacio.estado,
      vehiculoId: espacio.vehiculo?.id ?? null
    });
  }

  cerrarModal() {
    if (this.saving) {
      return;
    }

    this.mostrarModal = false;
    this.espacioEditando = null;
  }

  guardar() {
    this.error = '';
    this.success = '';

    if (this.espacioForm.invalid) {
      this.espacioForm.markAllAsTouched();
      return;
    }

    const formValue = this.espacioForm.getRawValue();

    if (formValue.estado === 'OCUPADO' && !formValue.vehiculoId) {
      this.error = 'Selecciona un vehiculo para ocupar el espacio';
      return;
    }

    const payload: CrearEspacioRequest = {
      numero: formValue.numero.trim().toUpperCase(),
      estado: formValue.estado,
      vehiculoId: formValue.estado === 'LIBRE' ? null : formValue.vehiculoId
    };

    this.saving = true;

    const request$ = this.espacioEditando?.id
      ? this.espacioService.actualizarEspacio(this.espacioEditando.id, payload)
      : this.espacioService.crearEspacio(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.success = this.espacioEditando
          ? 'Espacio actualizado correctamente'
          : 'Espacio creado correctamente';
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err) => {
        this.saving = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo guardar el espacio');
      }
    });
  }

  eliminar(espacio: Espacio) {
    if (!espacio.id || this.deletingId) {
      return;
    }

    this.espacioPendienteEliminar = espacio;
  }

  cancelarEliminacion() {
    if (this.deletingId) {
      return;
    }

    this.espacioPendienteEliminar = null;
  }

  confirmarEliminacion() {
    const espacio = this.espacioPendienteEliminar;

    if (!espacio?.id || this.deletingId) {
      return;
    }

    this.error = '';
    this.success = '';
    this.deletingId = espacio.id;

    this.espacioService.eliminarEspacio(espacio.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.espacioPendienteEliminar = null;
        this.success = 'Espacio eliminado correctamente';
        this.cargarDatos();
      },
      error: (err) => {
        this.deletingId = null;
        this.espacioPendienteEliminar = null;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo eliminar el espacio');
      }
    });
  }

  hasError(controlName: keyof EspacioForm['controls'], errorName: string): boolean {
    const control = this.espacioForm.controls[controlName];
    return control.hasError(errorName) && (control.touched || control.dirty);
  }

  estaEliminando(espacio: Espacio): boolean {
    return this.deletingId === espacio.id;
  }

  accionesDeshabilitadas(espacio: Espacio): boolean {
    return this.saving || this.estaEliminando(espacio);
  }

  textoEliminar(espacio: Espacio): string {
    return this.estaEliminando(espacio) ? 'Eliminando...' : 'Eliminar';
  }

  private cargarDatos() {
    this.loading = true;
    this.error = '';

    forkJoin({
      espacios: this.espacioService.getEspacios(),
      vehiculos: this.vehiculoService.listarVehiculos()
    }).subscribe({
      next: ({ espacios, vehiculos }) => {
        this.espacios = espacios;
        this.vehiculos = vehiculos;
        this.loading = false;
      },
      error: (err) => {
        this.espacios = [];
        this.vehiculos = [];
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudieron cargar los espacios');
      }
    });
  }
}
