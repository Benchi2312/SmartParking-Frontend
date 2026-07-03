# Smart Parking - Frontend

## 1. Descripción del Proyecto

Frontend del sistema Smart Parking, desarrollado con Angular standalone. Proporciona una interfaz moderna para la gestión de estacionamientos con dashboards para administradores y usuarios.

### Funcionalidades principales

- Autenticación con JWT (login/registro)
- Dashboard de administrador con métricas
- Dashboard de usuario con espacios y reservas
- CRUD de vehículos (con validación de propietario)
- CRUD de espacios de estacionamiento
- Sistema de reservas (crear, aprobar, rechazar)
- Asignación y liberación de espacios
- Protección de rutas por roles (ADMIN/USER)

---

## 2. Tecnologías Utilizadas

| Tecnología | Versión |
|---|---|
| Angular | 21 |
| TypeScript | 5.9 |
| RxJS | 7.8 |
| Bootstrap 5 | 5.3 |
| Tailwind CSS | 4 |
| SweetAlert2 | 11 |
| Vitest + jsdom | 4 |
| Express (SSR) | 5 |

---

## 3. Arquitectura del Proyecto

El proyecto usa **Angular standalone components** con estructura modular por funcionalidad.

```
src/app/
├── core/               → Guards (auth, admin, user) e interceptors HTTP
│   └── services/interceptors/  → auth.interceptor, loading.interceptor
├── features/
│   ├── auth/           → Login, Register
│   ├── dashboard/      → Layout admin + secciones (vehículos, espacios, usuarios)
│   ├── espacios/       → Listado público de espacios
│   ├── user/           → Dashboard de usuario con fragmentos
│   ├── usuarios/       → Listado de usuarios (admin)
│   └── vehiculos/      → CRUD de vehículos reutilizable
├── models/             → Interfaces TypeScript (Usuario, Vehiculo, Espacio, Reserva)
├── pages/home/         → Landing page
└── services/           → Servicios HTTP (auth, vehiculo, espacio, reserva, loading, error-message)
```

### Patrón de modales

Los modales utilizan `*ngIf` para control de presencia en el DOM combinado con CSS `display: flex`, evitando conflictos con Bootstrap global (`.modal { display: none; }`).

---

## 4. Rutas Principales

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Landing page |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro de usuario |
| `/user` | USER | Dashboard de usuario |
| `/dashboard` | ADMIN | Dashboard de administrador |
| `/dashboard/vehiculos` | ADMIN | Gestión de vehículos |
| `/dashboard/espacios` | ADMIN | Gestión de espacios |
| `/dashboard/usuarios` | ADMIN | Listado de usuarios |

---

## 5. Configuración y Ejecución

### Requisitos

- Node.js 18+
- npm 10+

### Instalar dependencias

```bash
cd smart-parking-frontend
npm install
```

### Configurar entorno

Editar `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### Iniciar servidor de desarrollo

```bash
npm start
```

Abrir en: `http://localhost:4200`

### Build de producción

```bash
npm run build
```

---

## 6. Pruebas

Se utiliza **Vitest** con jsdom para pruebas unitarias de componentes.

```bash
npm test
```

---

## 7. Seguridad

- Autenticación mediante JWT almacenado en localStorage
- Interceptor HTTP que adjunta token automáticamente
- Guards de ruta para ADMIN y USER
- Normalización de roles (ROLE_ADMIN → ADMIN, etc.)

---

## 8. Flujo General

### Usuario (USER)

1. Se registra e inicia sesión
2. Registra sus vehículos
3. Visualiza espacios disponibles
4. Crea reservas
5. Consulta historial de reservas

### Administrador (ADMIN)

1. Inicia sesión
2. Visualiza dashboard con métricas
3. Administra espacios (crear, editar, eliminar, liberar)
4. Visualiza vehículos y usuarios
5. Aprueba o rechaza reservas pendientes

---

## 9. Integrantes

- Benjamin Correa
- Jaime Guevara
- Gustavo Asencios

---

## 10. Estado Actual

- Autenticación JWT funcional
- Guards por roles operativos
- Dashboards conectados al backend
- CRUD completo de vehículos y espacios
- Sistema de reservas (crear, aprobar, rechazar)
- Diseño responsive con glassmorphism
- Integración total con API Spring Boot
- SSR con Angular Universal
