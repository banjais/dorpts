import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Filter out benign or non-actionable third-party library warnings/errors (Recharts defaultProps, findDOMNode, Leaflet, WebSocket, etc.)
const ignoredWarnings = [
  'defaultProps',
  'findDOMNode',
  'WebSocket',
  'react-leaflet',
  'recharts',
  'leaflet',
  'websocket',
  'HMR',
  'lucide-react',
  'Could not reach Cloud Firestore backend',
  '@firebase/firestore',
  'firestore',
  'Failed to execute \'put\' on \'Cache\'',
  'Entry was not found',
  'NotFoundError',
  'ERR_BLOCKED_BY_CLIENT',
  'save-page',
  'CrepeSdk',
  'data_backup/config',
];

const originalWarn = console.warn;
console.warn = (...args) => {
  const hasIgnored = args.some(arg => {
    const str = typeof arg === 'string' ? arg : (arg && typeof arg === 'object' && 'message' in arg ? String((arg as { message: unknown }).message) : String(arg));
    return str && ignoredWarnings.some(w => str.includes(w));
  });
  if (hasIgnored) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  const hasIgnored = args.some(arg => {
    const str = typeof arg === 'string' ? arg : (arg && typeof arg === 'object' && 'message' in arg ? String((arg as { message: unknown }).message) : String(arg));
    return str && ignoredWarnings.some(w => str.includes(w));
  });
  if (hasIgnored) return;
  originalError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonStr = typeof reason === 'string' ? reason : (reason && typeof reason === 'object' && 'message' in reason ? String((reason as { message: unknown }).message) : String(reason));
    if (ignoredWarnings.some(w => reasonStr.includes(w))) {
      event.preventDefault();
      return;
    }
    console.debug('[DORPTS] Unhandled promise rejection:', reason);
    event.preventDefault();
  });
}


