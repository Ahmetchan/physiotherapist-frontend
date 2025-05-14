import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// API URL - doğrudan backend'e yönlendir (slash ile bitmiyor)
axios.defaults.baseURL = 'https://physiotherapist-backend.onrender.com/api'
axios.defaults.withCredentials = true // CORS için true yapılması gerekiyor

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
  
  // Hatalı URL düzeltme - kritik kısım
  if (config.url) {
    // Mutlak URL'leri atla
    if (config.url.startsWith('http')) {
      return config
    }
    
    // `/api` ile başlayan URL'leri düzelt
    if (config.url.startsWith('/api/')) {
      // `/api/admin/settings` gibi URL'ler `/admin/settings` olarak düzeltilir
      config.url = config.url.substring(4) // '/api' kısmını kaldır
      console.log('Düzeltilmiş URL:', config.url)
    }
  }
  
  console.log('API İsteği:', config.method.toUpperCase(), config.baseURL + config.url)
  return config
}, function (error) {
  return Promise.reject(error)
})

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Hata detaylarını logla
    if (error.response) {
      // Sunucudan yanıt geldi ama hata kodu var
      console.error('API Hatası:', 
        error.response.status, 
        error.response.statusText, 
        error.response.data?.message || JSON.stringify(error.response.data))
    } else if (error.request) {
      // İstek yapıldı ama yanıt gelmedi
      console.error('Yanıt yok:', error.request)
    } else {
      // İstek oluşturulurken hata oldu
      console.error('İstek hatası:', error.message)
    }
    return Promise.reject(error)
  }
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)