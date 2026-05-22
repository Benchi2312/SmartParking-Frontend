import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorMessageService {
  fromBackend(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend este activo.';
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.status === 400) {
      return 'La informacion enviada no es valida. Revisa los campos.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'No tienes permisos para realizar esta accion.';
    }

    if (error.status >= 500) {
      return 'Ocurrio un problema en el servidor. Intenta nuevamente.';
    }

    return fallback;
  }
}
