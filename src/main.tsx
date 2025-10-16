import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { OfficeProvider } from './contexts/OfficeContext';
import { CategoryProvider } from './contexts/CategoryContext';

createRoot(document.getElementById('root')!).render(

    <BrowserRouter>
      <AuthProvider>
        <OfficeProvider>
          <CategoryProvider>
            <App />
          </CategoryProvider>
        </OfficeProvider>
      </AuthProvider>
    </BrowserRouter>

);