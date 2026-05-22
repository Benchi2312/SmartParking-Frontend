import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { Usuario } from '../../../models/usuario.model';
import { AuthService } from '../../../services/auth.service';
import { ErrorMessageService } from '../../../services/error-message.service';

@Component({
  selector: 'app-list-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-usuarios.component.html',
  styleUrls: ['./list-usuarios.component.css']
})
export class ListUsuariosComponent implements OnInit {
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
}
