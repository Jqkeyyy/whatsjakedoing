import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminApp } from './admin/AdminApp';
import './index.css';

const isAdmin = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isAdmin ? <AdminApp /> : <App />}</StrictMode>
);
