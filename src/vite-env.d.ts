/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // ajoutez d'autres variables env ici
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}