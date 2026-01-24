# ETApp

Full-stack expense tracker:
- **Mobile app**: Expo + Expo Router (`/app`)
- **Backend API**: Node.js + Express + Neon Postgres (`/backend`)

## Prerequisites
- **Node.js**: 20.19.x or newer recommended (Expo SDK 54 requirement)
- **npm**: comes with Node

## Repo structure
- `app/`: Expo mobile app
- `backend/`: Express API (Postgres via Neon, rate limiting via Upstash)

## Environment variables

### Mobile (`app/.env`)
- **`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`**: Clerk publishable key used by the app

### Backend (`backend/.env`)
- **`DATABASE_URL`**: Neon Postgres connection string
- **`UPSTASH_REDIS_REST_URL`** / **`UPSTASH_REDIS_REST_TOKEN`**: required for rate limiting
- **`API_URL`**: used by the cron job to ping the API in production (for example: `https://<your-host>/api/health`)
- **`PORT`** (optional): defaults to `5001`
- **`NODE_ENV`** (optional): if set to `production`, the cron job is enabled

> Note: `.env` files are ignored by git via the root `.gitignore`.

## Setup

### 1) Install backend deps
```bash
cd backend
npm install
```

### 2) Install app deps
```bash
cd app
npm install
```

## Run (development)

### Start backend API
```bash
cd backend
npm run dev
```

API routes:
- `GET /api/health`
- `GET /api/transactions/:userId`
- `GET /api/transactions/summary/:userId`
- `POST /api/transactions`
- `DELETE /api/transactions/:id`

### Start mobile app
```bash
cd app
npx expo start
```

## Notes / troubleshooting
- **Expo SDK 54 / React Native mismatch**: make sure your installed versions match SDK 54, then run:

```bash
cd app
npx expo install --fix
npx expo start -c
```

- **Rate limiting**: backend uses Upstash in `backend/src/middleware/rateLimiter.js`. Missing Upstash env vars can break requests.

