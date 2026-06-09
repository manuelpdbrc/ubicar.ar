# ubicar.ar

Plataforma de gestión de ubicaciones geográficas con escaneo QR, circuitos de auditoría y sincronización offline.

## Stack

- **Frontend**: Vite + React 19 + TypeScript
- **Backend**: Express 5 + Prisma 6 + MariaDB
- **Mapas**: Leaflet + OpenStreetMap
- **Deploy**: Hostinger Business (Node.js)

## Setup Local

### Backend
```bash
cd backend
cp .env.example .env  # Configurar DATABASE_URL y JWT_SECRET
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

El frontend corre en `http://localhost:5173` con proxy a `http://localhost:4000`.

## Build & Deploy

```bash
cd backend
npm run build    # Compila frontend + backend + copia dist
npm start        # Inicia servidor de producción
```

## Estructura

```
mapper/
├── frontend/    # Vite + React 19 SPA
├── backend/     # Express 5 API + Prisma ORM
└── .github/     # CI/CD workflows
```
