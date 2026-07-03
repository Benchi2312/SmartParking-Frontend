import { inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

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

function isBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}

function tokenVigente(token: string | null): boolean {
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function limpiarSesion() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
}

function normalizeRole(rol: string | null | undefined): 'ADMIN' | 'USER' {
  const normalized = (rol || '').trim().toUpperCase().replace('ROLE_', '');
  return normalized === 'ADMIN' ? 'ADMIN' : 'USER';
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (!isBrowser()) {
    return true;
  }

  const usuario = getUsuario();
  const token = getToken();

  if (tokenVigente(token) && usuario?.id && normalizeRole(usuario.rol)) {
    return true;
  }

  limpiarSesion();
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (!isBrowser()) {
    return true;
  }

  const usuario = getUsuario();
  const token = getToken();

  if (!tokenVigente(token) || !usuario?.id || !usuario.rol) {
    limpiarSesion();
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

  if (!isBrowser()) {
    return true;
  }

  const usuario = getUsuario();
  const token = getToken();

  if (!tokenVigente(token) || !usuario?.id || !usuario.rol) {
    limpiarSesion();
    router.navigate(['/login']);
    return false;
  }

  if (normalizeRole(usuario.rol) === 'ADMIN') {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};
