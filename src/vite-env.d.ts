/// <reference types="vite/client" />

declare module 'leaflet/dist/images/marker-icon.png' {
  const content: string;
  export default content;
}

declare module 'leaflet/dist/images/marker-shadow.png' {
  const content: string;
  export default content;
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (swRegistration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare module 'virtual:pwa-register/react' {
  import type { FunctionComponent } from 'react';

  export interface RegisterSWOptionsReact {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (swRegistration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  export interface UseRegisterSW {
    needRefresh: boolean;
    offlineReady: boolean;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  }

  export function useRegisterSW(options?: RegisterSWOptionsReact): UseRegisterSW;

  const RegisterSW: FunctionComponent<RegisterSWOptionsReact>;
  export default RegisterSW;
}
