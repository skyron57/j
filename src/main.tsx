import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameStateProvider } from './contexts/GameStateContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import './index.css';

// Import fonts
import '@fontsource/bebas-neue';
import '@fontsource/staatliches';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <GameStateProvider>
            <App />
          </GameStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
