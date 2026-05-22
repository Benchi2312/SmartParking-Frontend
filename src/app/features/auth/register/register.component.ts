import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { ErrorMessageService } from '../../../services/error-message.service';

type RegisterForm = FormGroup<{
  nombre: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  error: string = '';
  success: string = '';
  loading: boolean = false;

  registerForm: RegisterForm = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    })
  });

  constructor(
    private authService: AuthService,
    private errorMessageService: ErrorMessageService,
    private router: Router
  ) {}

  register() {
    this.error = '';
    this.success = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();
    this.loading = true;

    this.authService.register({
      nombre: formValue.nombre.trim(),
      email: formValue.email.trim(),
      password: formValue.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Cuenta creada correctamente. Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/login']), 700);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.errorMessageService.fromBackend(err, 'No se pudo crear la cuenta');
      }
    });
  }

  hasError(controlName: keyof RegisterForm['controls'], errorName: string): boolean {
    const control = this.registerForm.controls[controlName];
    return control.hasError(errorName) && (control.touched || control.dirty);
  }
}
