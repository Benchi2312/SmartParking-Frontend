import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { Usuario } from '../../../models/usuario.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName: string = 'Administrador';

  constructor(private router: Router) {}

  ngOnInit() {
    this.cargarUsuario();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    this.router.navigate(['/login']);
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
    this.userName = usuario?.nombre || usuario?.email || 'Administrador';
  }

  private parseUsuario(usuarioStorage: string): Usuario | null {
    try {
      return JSON.parse(usuarioStorage) as Usuario;
    } catch {
      return null;
    }
  }
}
