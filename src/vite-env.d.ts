/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_VERSION: string;
  readonly VITE_ALLOW_SIGNUP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
