import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminApp from './admin/AdminApp.jsx';
import { hydrateContent } from './content/loadContent.js';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
if (window.location.pathname.startsWith('/supabase-admin')) {
  root.render(<AdminApp />);
} else {
  hydrateContent()
    .catch((error) => console.warn('Unable to load Supabase content; using bundled content.', error))
    .finally(() => root.render(<App />));
}
