import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// API URL - doğrudan backend'e yönlendir
axios.defaults.baseURL = 'https://physiotherapist-backend.onrender.com/api'
axios.defaults.withCredentials = false

// Default headers
axios.defaults.headers.common = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Axios interceptor CORS hatalarını önlemek için
axios.interceptors.request.use(function (config) {
  // Cache busting için timestamp ekle
  if (config.method === 'get') {
    config.params = { ...config.params || {}, timestamp: Date.now() }
  }
  
  // Hatalı URL düzeltme
  // /api/api/... yerine /api/... olarak düzelt
  if (config.url && config.url.startsWith('/api/')) {
    config.url = config.url.replace('/api/', '/')
  }
  
  console.log('API İsteği:', config.url)
  return config
}, function (error) {
  return Promise.reject(error)
})

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