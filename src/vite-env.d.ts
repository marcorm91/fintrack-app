/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_DB?: string;
  readonly VITE_SEED_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
