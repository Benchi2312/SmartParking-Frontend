import { Routes } from '@angular/router';

import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { AdminDashboardContentComponent } from './features/dashboard/admin-dashboard/admin-dashboard.component';
import { AdminVehiculosComponent } from './features/dashboard/admin-vehiculos/admin-vehiculos.component';
import { AdminEspaciosComponent } from './features/dashboard/admin-espacios/admin-espacios.component';
import { AdminUsuariosComponent } from './features/dashboard/admin-usuarios/admin-usuarios.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardUserComponent } from './features/user/dashboard-user/dashboard-user.component';
import { HomeComponent } from './pages/home/home.component';
import { adminGuard, userGuard } from './core/guards/session.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'user', component: DashboardUserComponent, canActivate: [userGuard] },

  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardContentComponent, data: { title: 'Dashboard', subtitle: 'Resumen general del sistema' } },
      { path: 'vehiculos', component: AdminVehiculosComponent, data: { title: 'Vehículos', subtitle: 'Gestión de vehículos registrados' } },
      { path: 'espacios', component: AdminEspaciosComponent, data: { title: 'Espacios', subtitle: 'Monitoreo y control de espacios de estacionamiento en tiempo real' } },
      { path: 'usuarios', component: AdminUsuariosComponent, data: { title: 'Usuarios', subtitle: 'Listado de usuarios registrados' } }
    ]
  }
];
