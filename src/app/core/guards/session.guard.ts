import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Usuario } from '../../models/usuario.model';

function getUsuario(): Usuario | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const usuarioStorage = localStorage.getItem('usuario');

  if (!usuarioStorage) {
    return null;
  }

  try {
    return JSON.parse(usuarioStorage) as Usuario;
  } catch {
    return null;
  }
}

function getToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
}

function normalizeRole(rol: string | null | undefined): 'ADMIN' | 'USER' {
  const normalized = (rol || '').trim().toUpperCase().replace('ROLE_', '');
  return normalized === 'ADMIN' ? 'ADMIN' : 'USER';
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const usuario = getUsuario();
  const token = getToken();

  if (token && usuario?.id && normalizeRole(usuario.rol)) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const usuario = getUsuario();
  const token = getToken();

  if (!token || !usuario?.id || !usuario.rol) {
    router.navigate(['/login']);
    return false;
  }

  if (normalizeRole(usuario.rol) !== 'ADMIN') {
    router.navigate(['/user']);
    return false;
  }

  return true;
};

export const userGuard: CanActivateFn = () => {
  const router = inject(Router);
  const usuario = getUsuario();
  const token = getToken();

  if (!token || !usuario?.id || !usuario.rol) {
    router.navigate(['/login']);
    return false;
  }

  if (normalizeRole(usuario.rol) === 'ADMIN') {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
