import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Vehiculo } from '../../../models/vehiculo.model';
import { ErrorMessageService } from '../../../services/error-message.service';
import { VehiculoService } from '../../../services/vehiculo.service';

@Component({
  selector: 'app-admin-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-vehiculos.component.html',
  styleUrls: ['./admin-vehiculos.component.css']
})
export class AdminVehiculosComponent implements OnInit {
  vehiculos: Vehiculo[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';
  deletingId: number | null = null;

  constructor(
    private vehiculoService: VehiculoService,
    private errorMessageService: ErrorMessageService
  ) {}

  ngOnInit() {
    this.cargarVehiculos();
  }

  get filteredVehiculos(): Vehiculo[] {
    if (!this.searchTerm.trim()) { return this.vehiculos; }

    const term = this.searchTerm.toLowerCase();

    return this.vehiculos.filter(
      (v) =>
        v.placa.toLowerCase().includes(term) ||
        v.marca.toLowerCase().includes(term) ||
        (v.usuarioNombre && v.usuarioNombre.toLowerCase().includes(term)) ||
        (v.usuarioEmail && v.usuarioEmail.toLowerCase().includes(term))
    );
  }

  cargarVehiculos() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.vehiculoService.listarVehiculos().subscribe({
      next: (vehiculos) => {
        this.vehiculos = vehiculos;
        this.loading = false;
      },
      error: (err) => {
        this.vehiculos = [];
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudieron cargar los vehiculos');
      }
    });
  }

  eliminarVehiculo(id: number) {
    if (this.deletingId) { return; }

    this.deletingId = id;
    this.error = '';
    this.success = '';

    this.vehiculoService.eliminarVehiculo(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.success = 'Vehiculo eliminado correctamente';
        this.cargarVehiculos();
      },
      error: (err) => {
        this.deletingId = null;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo eliminar el vehiculo');
      }
    });
  }
}
