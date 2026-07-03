import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Usuario } from '../../../models/usuario.model';
import { AuthService, LoginResponse } from '../../../services/auth.service';
import { ErrorMessageService } from '../../../services/error-message.service';

type LoginForm = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  error: string = '';
  loading: boolean = false;

  loginForm: LoginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor(
    private authService: AuthService,
    private errorMessageService: ErrorMessageService,
    private router: Router
  ) {}

  login() {
    this.error = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.loading = true;

    this.authService.login(email.trim(), password).subscribe({
      next: (response) => {
        this.loading = false;
        this.saveSession(response);
        this.redirectByRole(response.rol);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo iniciar sesion');
      }
    });
  }

  hasError(controlName: keyof LoginForm['controls'], errorName: string): boolean {
    const control = this.loginForm.controls[controlName];
    return control.hasError(errorName) && (control.touched || control.dirty);
  }

  private saveSession(response: LoginResponse) {
    const usuario = response.usuario;
    const rol = this.normalizeRole(response.rol || usuario.rol);
    const usuarioLogueado: Usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol
    };

    localStorage.setItem('token', response.token);
    localStorage.setItem('usuario', JSON.stringify(usuarioLogueado));
    localStorage.setItem('rol', usuarioLogueado.rol);
  }

  private redirectByRole(rol: Usuario['rol']) {
    const normalizedRole = this.normalizeRole(rol);

    if (normalizedRole === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.router.navigate(['/user']);
  }

  private normalizeRole(rol: string | null | undefined): 'ADMIN' | 'USER' {
    const normalized = (rol || '').trim().toUpperCase().replace('ROLE_', '');
    return normalized === 'ADMIN' ? 'ADMIN' : 'USER';
  }
}
