// Pixi without eval, so the production CSP needs no 'unsafe-eval' (architecture, Security).
import 'pixi.js/unsafe-eval';
import '@/app/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { crashReporter } from '@/lib/crash';

// Later stories add: read the fragment, load the save, then mount.
crashReporter.install(window);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html has no #root element');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
