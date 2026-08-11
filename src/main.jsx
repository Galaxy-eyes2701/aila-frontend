import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@infrastructure/styles/global.css';
import App from './App.jsx';
import { AuthProvider } from '@state/context/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);