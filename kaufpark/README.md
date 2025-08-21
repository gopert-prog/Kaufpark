# Kaufpark

Piloto de aplicación web para estacionamientos en un centro comercial.

## Requisitos
- Node.js 18+

## Instalación
```bash
npm install
npm run dev
```

La app se inicia en `http://localhost:3000`.

## Flujo Cliente
- Escanear QR a `/spot/:plaza` (ej: `/spot/A-12`).
- Ver video publicitario (6s mínimos) y luego habilita “Solicitar servicio”.
- Al solicitar, se crea una solicitud vinculada a la plaza.

## Accesos
- Operador: usuario `operator` / clave `operator123`
- Admin: usuario `admin` / clave `admin123`

## Panel Operador
- `/operator/login` → lista solicitudes pendientes y cambio de estado.

## Panel Admin
- `/admin/login` → subir/gestionar video, ver solicitudes, ver estadísticas.

## Configuración
- Videos subidos quedan en `/public/uploads/videos` y se referencian desde la DB.

## Notas
- DB: SQLite en `src/db/kaufpark.sqlite`.
- Sesiones: SQLite store en `src/db/sessions.sqlite`.