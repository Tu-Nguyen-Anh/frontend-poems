/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_OPLEARN_API_URL?: string
  readonly VITE_AVATAR_BASE_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_APP_NAME?: string
  readonly DEV?: boolean
  readonly PROD?: boolean
  readonly SSR?: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
