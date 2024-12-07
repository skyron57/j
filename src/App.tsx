import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GameStateProvider } from './contexts/GameStateContext';
import { SecurityService } from './services/security';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Game } from './pages/Game';
import { Murders } from './pages/Murders';
import { Rankings } from './pages/Rankings';
import { Inventory } from './pages/Inventory';
import { Shop } from './pages/Shop';
import { Messages } from './pages/Messages';
import { AdminPanel } from './pages/AdminPanel';
import { PrivateRoute } from './components/PrivateRoute';
import { GameLayout } from './components/GameLayout';
import { AuthProvider } from './contexts/AuthContext'; // Assure-toi d'importer AuthProvider

export default function App() {
  React.useEffect(() => {
    // Set user IP for admin access
    const securityService = SecurityService.getInstance();
    securityService.setUserIP('88.182.169.164'); // Your admin IP
  }, []);

  return (
    <AuthProvider> {/* Envelopper l'application avec AuthProvider */}
      <GameStateProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/game" element={<PrivateRoute><GameLayout /></PrivateRoute>}>
            <Route index element={<Game />} />
            <Route path="murders" element={<Murders />} />
            <Route path="rankings" element={<Rankings />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="shop" element={<Shop />} />
            <Route path="messages" element={<Messages />} />
          </Route>
          <Route path="/admin" element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </GameStateProvider>
    </AuthProvider> 
  );
}
