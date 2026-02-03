/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEED_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
