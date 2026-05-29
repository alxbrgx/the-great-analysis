/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Absolute base URL of the backend API in production (e.g. https://tga-backend.onrender.com/api/v1).
  // Left unset in dev, where the Vite proxy forwards /api → localhost:8000.
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
