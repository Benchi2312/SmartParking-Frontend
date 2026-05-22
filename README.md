# Smart Parking - Frontend

## 1. Descripción del Proyecto

Este proyecto corresponde al frontend del sistema Smart Parking, desarrollado con Angular.

Permite la interacción visual con el sistema mediante:

- login y registro
- dashboard de administrador
- dashboard de usuario
- gestión de vehículos
- gestión de espacios
- reservas
- visualización de historial

El frontend consume una API REST desarrollada con Spring Boot.

---

# 2. Tecnologías Utilizadas

- Angular 21
- TypeScript
- RxJS
- Bootstrap 5
- Angular Router
- Reactive Forms

---

# 3. Arquitectura del Proyecto

El proyecto utiliza Angular standalone components y está organizado por módulos funcionales.

```text
src/app/
```

## Estructura

```text
core/            -> Guards e interceptors
features/        -> Componentes principales
models/          -> Interfaces TypeScript
services/        -> Servicios HTTP
```

---

# 4. Funcionalidades Implementadas

## Autenticación

- login
- registro
- manejo de sesión JWT
- guards por roles

---

## Dashboard USER

El usuario puede:

- registrar vehículos
- editar vehículos
- eliminar vehículos
- visualizar espacio asignado
- visualizar historial
- crear reservas

---

## Dashboard ADMIN

El administrador puede:

- visualizar usuarios
- visualizar vehículos
- administrar espacios
- asignar espacios
- cambiar estados de espacios
- visualizar métricas generales

---

# 5. Rutas Principales

## Públicas

```text
/
```

```text
/login
```

```text
/register
```

---

## USER

```text
/user
```

---

## ADMIN

```text
/dashboard
```

---

# 6. Configuración del Proyecto

## Instalar dependencias

Entrar a la carpeta del proyecto:

```bash
cd smart-parking-frontend
```

Instalar paquetes:

```bash
npm install
```

---

# 7. Configuración Backend

Verificar archivo:

```text
src/environments/environment.ts
```

Debe apuntar al backend:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

---

# 8. Ejecutar el Proyecto

## Ejecutar Angular

```bash
npm start
```

o:

```bash
ng serve
```

Abrir en navegador:

```text
http://localhost:4200
```

---

# 9. Build de Producción

```bash
npm run build
```

---

# 10. Flujo General del Sistema

## USER

1. Se registra
2. Inicia sesión
3. Registra vehículos
4. Gestiona sus vehículos
5. Visualiza su espacio
6. Crea reservas
7. Consulta historial

---

## ADMIN

1. Inicia sesión
2. Visualiza dashboard general
3. Administra espacios
4. Visualiza usuarios
5. Visualiza vehículos
6. Gestiona estados de espacios

---

# 11. Seguridad Implementada

El frontend utiliza:

- JWT Authentication
- HTTP Interceptors
- Route Guards
- Protección por roles ADMIN y USER

---

# 12. Evidencias del Funcionamiento



- Login
- Registro
- Dashboard USER
- Dashboard ADMIN
- CRUD de vehículos
- CRUD de espacios
- Reservas
- Historial
- Guards funcionando

---

# 13. Integrantes

- Benjamin Correa
- Jaime Guevara
- Gustavo Asencios

---

# 14. Estado Actual del Proyecto

Actualmente el frontend cuenta con:

- autenticación JWT
- guards por roles
- dashboards funcionales
- CRUD de vehículos
- CRUD de espacios
- reservas básicas
- diseño responsive
- integración completa con backend Spring Boot