import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// API URL'ini ayarla
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://physiotherapist-backend.onrender.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
