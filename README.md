# Impostor Game

Juego estilo "impostor" con salas en tiempo real. El frontend esta hecho con Next.js y el backend con Express + Socket.IO. Se puede crear una sala, unirse, chatear y jugar por fases (categorias, palabras, discusion, votacion y final).

🔴 Link: https://impostor-game-gamma-seven.vercel.app/

## Stack

- Frontend: Next.js (App Router), React, Tailwind CSS, Socket.IO client
- Backend: Node.js, Express, Socket.IO, TypeScript

## Estructura del repo

- backend/: API y servidor de sockets
- frontend/: UI con Next.js, React, Tailwind CSS

## Variables de entorno (backend)

Crear un archivo `.env` en `backend/`:

```
PORT=3001
CLIENT_URL=http://localhost:3000
```

## Como correr en desarrollo

Backend:

```
cd backend
npm install
npm run dev
```

Frontend:

```
cd frontend
npm install
npm run dev
```

Luego abrir `http://localhost:3000`.

## Scripts utiles

Backend:

- `npm run dev` inicia el servidor con nodemon

Frontend:

- `npm run dev` inicia Next.js en modo desarrollo

## Endpoints principales (backend)

- `GET /health` estado del servidor
- `GET /rooms` listado de salas
- `GET /categories` categorias disponibles
