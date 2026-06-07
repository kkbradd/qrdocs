import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#191919',
              color: '#EFEFEF',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: '#C9A84C', secondary: '#080808' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);