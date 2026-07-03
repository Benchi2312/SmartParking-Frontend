import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { Usuario } from '../../../models/usuario.model';
import { AuthService } from '../../../services/auth.service';
import { ErrorMessageService } from '../../../services/error-message.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.css']
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private errorMessageService: ErrorMessageService
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading = true;
    this.error = '';

    this.authService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.loading = false;
      },
      error: (err) => {
        this.usuarios = [];
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudieron cargar los usuarios');
      }
    });
  }

  rolBadgeClass(rol: string): string {
    const normalized = rol.toUpperCase().replace('ROLE_', '');
    return normalized === 'ADMIN' ? 'role-badge role-admin' : 'role-badge role-user';
  }

  rolLabel(rol: string): string {
    return rol.toUpperCase().replace('ROLE_', '');
  }
}
