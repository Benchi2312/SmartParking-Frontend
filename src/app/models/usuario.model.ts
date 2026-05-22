export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'USER' | string;
}
