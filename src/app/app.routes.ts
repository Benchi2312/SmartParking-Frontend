import { Routes } from '@angular/router';
import { ListUsuariosComponent } from './features/usuarios/list-usuarios/list-usuarios.component';

import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { ListVehiculosComponent } from './features/vehiculos/list-vehiculos/list-vehiculos.component';
import { ListEspaciosComponent } from './features/espacios/list-espacios/list-espacios.component';
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
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'vehiculos', pathMatch: 'full' },
      { path: 'vehiculos', component: ListVehiculosComponent },
      { path: 'espacios', component: ListEspaciosComponent },
      { path: 'usuarios', component: ListUsuariosComponent }
    ]
  }
];
