import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// API URL
axios.defaults.baseURL = '' // Kök URL kullan, proxy yönlendirmesi için
axios.defaults.withCredentials = false

// Default headers
axios.defaults.headers.common = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Log requests ve responses
axios.interceptors.request.use(
  (config) => {
    // Cache busting için timestamp ekle
    if (config.method === 'get') {
      config.params = { ...config.params || {}, timestamp: Date.now() }
    }
    return config
  },
  (error) => Promise.reject(error)
)

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Hatası:', error.response?.status, error.response?.data?.message || error.message)
    return Promise.reject(error)
  }
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)