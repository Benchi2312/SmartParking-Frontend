import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { Usuario } from '../../../models/usuario.model';
import { AppFooterComponent } from '../../../shared/components/app-footer/app-footer.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, AppFooterComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  userName: string = 'Administrador';
  pageTitle: string = 'Dashboard';
  pageSubtitle: string = 'Resumen general del sistema';
  sidebarOpen = false;
  private routeSub?: Subscription;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.cargarUsuario();
    this.routeSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const child = this.route.firstChild;
      if (child?.snapshot.data) {
        this.pageTitle = child.snapshot.data['title'] || 'Dashboard';
        this.pageSubtitle = child.snapshot.data['subtitle'] || 'Resumen general del sistema';
      }
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
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
