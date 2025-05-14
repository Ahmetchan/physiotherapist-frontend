import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Appointment from './pages/Appointment';
import About from './pages/About';
import Admin from './pages/Admin';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

function AppRoutes({ settings, setSettings }) {
  const location = useLocation();
  return (
    <div className="app-layout">
      {/* Sosyal medya ikonları: admin sayfası hariç */}
      {location.pathname !== '/admin' && (
        <div className="social-icons-fixed-custom">
          <a
            href="https://wa.me/905537011405?text=Merhaba%2C%20Bilgi%20alabilir%20miyim%3F"
            target="_blank"
            rel="noopener noreferrer"
            title="Whatsapp"
            className="whatsapp"
          >
            <FaWhatsapp />
          </a>
          <a
            href="https://www.instagram.com/fizyomen_/"
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
            className="instagram"
          >
            <FaInstagram />
          </a>
        </div>
      )}
      <Sidebar siteTitle={settings.siteTitle} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/randevu" element={<Appointment />} />
          <Route path="/hakkimda" element={<About aboutContent={settings.aboutContent} />} />
          <Route path="/admin" element={<Admin settings={settings} setSettings={setSettings} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('Ayarlar getiriliyor...');
        
        // Cache busting için zaman damgası ekleyin
        const timestamp = new Date().getTime();
        // Mutlak URL kullanarak CORS sorunlarını önleyin
        const response = await axios.get(`/api/admin/settings?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('Ayarlar alındı:', response.data);
        setSettings(response.data);
      } catch (error) {
        console.error('Ayarlar getirilirken hata:', error);
        
        // Fallback değerler atayın
        setSettings({
          siteTitle: 'Fizyoterapist Randevu Sistemi',
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          fontFamily: 'Arial, sans-serif',
          aboutContent: '<p>Hakkımda içeriği burada görüntülenecek</p>',
          backgroundImage: ''
        });
      }
    };

    fetchSettings();
  }, []);

  return (
    <Router>
      <AppRoutes settings={settings} setSettings={setSettings} />
    </Router>
  );
}

export default App;
