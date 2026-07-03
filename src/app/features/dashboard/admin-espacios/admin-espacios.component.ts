import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

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
  selector: 'app-admin-espacios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-espacios.component.html',
  styleUrls: ['./admin-espacios.component.css']
})
export class AdminEspaciosComponent implements OnInit {
  espacios: Espacio[] = [];
  vehiculos: Vehiculo[] = [];
  liberandoEspacioId: number | null = null;
  loading: boolean = false;
  error: string = '';
  espacioError: string = '';
  saving: boolean = false;
  success: string = '';
  private cargandoEspacios = false;

  mostrarModal: boolean = false;
  espacioSeleccionado: Espacio | null = null;
  deletingId: number | null = null;
  modalTitle: string = '';
  submitText: string = '';

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
    private errorMessageService: ErrorMessageService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.cargarEspacios();

    this.espacioForm.controls.estado.valueChanges.subscribe((estado) => {
      if (estado === 'LIBRE') {
        this.espacioForm.controls.vehiculoId.setValue(null, { emitEvent: false });
      }
    });
  }

  cargarEspacios() {
    if (this.cargandoEspacios) { return; }
    this.cargandoEspacios = true;
    this.loading = true;
    this.error = '';
    this.espacioError = '';
    this.success = '';

    forkJoin({
      espacios: this.espacioService.getEspacios(),
      vehiculos: this.vehiculoService.listarVehiculos()
    }).pipe(
      finalize(() => {
        this.cargandoEspacios = false;
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ espacios, vehiculos }) => {
        this.espacios = espacios;
        this.vehiculos = vehiculos;
      },
      error: (err) => {
        this.espacios = [];
        this.vehiculos = [];
        this.error = this.errorMessageService.fromBackend(err, 'No se pudieron cargar los espacios');
      }
    });
  }

  abrirModalCrear() {
    this.ngZone.run(() => {
      this.espacioSeleccionado = null;
      this.modalTitle = 'Nuevo Espacio';
      this.submitText = 'Guardar';
      this.error = '';
      this.success = '';
      this.espacioForm.reset({ numero: '', estado: 'LIBRE', vehiculoId: null }, { emitEvent: false });
      this.mostrarModal = true;
      this.cdr.detectChanges();
      console.log('Modal crear abierto forzado');
    });
  }

  abrirModalEditar(espacio: Espacio) {
    this.ngZone.run(() => {
      this.espacioSeleccionado = espacio;
      this.modalTitle = 'Editar Espacio';
      this.submitText = 'Actualizar';
      this.error = '';
      this.success = '';
      this.espacioForm.setValue({
        numero: espacio.numero,
        estado: espacio.estado,
        vehiculoId: espacio.vehiculo?.id ?? null
      }, { emitEvent: false });
      this.mostrarModal = true;
      this.cdr.detectChanges();
      console.log('Modal editar abierto forzado');
    });
  }

  cerrarModal() {
    if (this.saving) { return; }
    this.mostrarModal = false;
    this.espacioSeleccionado = null;
    this.error = '';
    this.cdr.detectChanges();
  }

  guardar() {
    this.error = '';

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

    const request$ = this.espacioSeleccionado?.id
      ? this.espacioService.actualizarEspacio(this.espacioSeleccionado.id, payload)
      : this.espacioService.crearEspacio(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.success = this.espacioSeleccionado
          ? 'Espacio actualizado correctamente'
          : 'Espacio creado correctamente';
        this.cerrarModal();
        this.cargarEspacios();
      },
      error: (err) => {
        this.saving = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo guardar el espacio');
      }
    });
  }

  private async swal() {
    const m = await import('sweetalert2');
    return m.default;
  }

  async confirmarEliminacion(espacio: Espacio) {
    const Swal = await this.swal();
    const result = await Swal.fire({
      title: 'Eliminar espacio',
      text: `¿Estas seguro de que deseas eliminar el espacio ${espacio.numero}? Esta accion no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1e293b',
      color: '#f8fafc'
    });
    if (result.isConfirmed) {
      this.eliminarEspacio(espacio.id);
    }
  }

  async eliminarEspacio(id: number) {
    if (this.deletingId) { return; }
    this.deletingId = id;
    this.error = '';
    this.success = '';

    try {
      await firstValueFrom(this.espacioService.eliminarEspacio(id));
      this.deletingId = null;
      const Swal = await this.swal();
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El espacio ha sido eliminado correctamente.',
        background: '#1e293b',
        color: '#f8fafc',
        timer: 2000,
        showConfirmButton: false
      });
      this.cargarEspacios();
    } catch (err) {
      this.deletingId = null;
      const Swal = await this.swal();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.errorMessageService.fromBackend(err, 'No se pudo eliminar el espacio'),
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#475569',
        confirmButtonText: 'Cerrar'
      });
    }
  }

  liberarEspacio(espacio: Espacio) {
    if (!espacio.id || this.liberandoEspacioId) { return; }
    this.liberandoEspacioId = espacio.id;
    this.espacioError = '';

    this.espacioService.liberarEspacio(espacio.id).subscribe({
      next: () => {
        this.liberandoEspacioId = null;
        this.cargarEspacios();
      },
      error: (err) => {
        this.liberandoEspacioId = null;
        this.espacioError = this.errorMessageService.fromBackend(err, 'No se pudo liberar el espacio');
      }
    });
  }
}
