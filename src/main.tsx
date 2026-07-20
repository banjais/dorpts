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
    console.debug('[DORPTS] Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });
}


