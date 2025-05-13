import { useState, useEffect } from 'react';
import moment from 'moment';
import axios from 'axios';
import 'moment/locale/tr';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaUser, FaClock, FaMapMarkerAlt, FaEllipsisV, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Editor } from '@tinymce/tinymce-react';
import AdminBlockedSlots from './AdminBlockedSlots';

moment.locale('tr');

const EventCard = ({ event }) => (
  <div style={{
    background: '#e6edfa',
    borderRadius: 10,
    padding: '8px 12px',
    boxShadow: '0 2px 8px 0 rgba(37,99,235,0.07)',
    borderLeft: '4px solid #2563eb',
    marginBottom: 2
  }}>
    <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 15 }}>{event.patientName}</div>
    <div style={{ fontSize: 13, color: '#333' }}>{event.appointmentTime} {event.notes && <span style={{ color: '#888' }}>- {event.notes}</span>}</div>
    <div style={{ fontSize: 12, color: '#888' }}>{event.status}</div>
  </div>
);

const Admin = ({ settings, setSettings }) => {
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState(localStorage.getItem('adminPassword') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('calendar');
  const [message, setMessage] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const [editMenuOpen, setEditMenuOpen] = useState(null);
  const [searchParams, setSearchParams] = useState({
    patientName: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [stats, setStats] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedPassword = localStorage.getItem('adminPassword');
    if (storedPassword && !isAuthenticated) {
      axios.post('/api/admin/login', { password: storedPassword })
        .then(res => {
          if (res.data.success) {
            setIsAuthenticated(true);
            setAdminPassword(storedPassword);
          }
        })
        .catch(() => {
          setIsAuthenticated(false);
          setAdminPassword('');
          localStorage.removeItem('adminPassword');
        });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
      fetchSettings();
      setMessage('');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setMessage('');
    if (isAuthenticated && activeTab === 'calendar') {
      fetchAppointments();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && adminPassword) {
      fetchAppointments();
      fetchSettings();
      setMessage('');
    }
  }, [isAuthenticated, adminPassword]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (showStatsModal) {
      fetchStats();
    }
  }, [showStatsModal, selectedYear, selectedMonth]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/admin/login', { password });
      if (response.data.success) {
        localStorage.setItem('adminPassword', password);
        setIsAuthenticated(true);
        setAdminPassword(password);
      } else {
        setError('Geçersiz şifre');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!isAuthenticated || !adminPassword) return;
    
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/appointments', {
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      const formattedAppointments = response.data.map(appointment => {
        const start = new Date(appointment.appointmentDate);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          ...appointment,
          start,
          end,
          title: `${appointment.patientName} - ${appointment.appointmentTime}`
        };
      });
      setAppointments(formattedAppointments);
      setMessage('');
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setAdminPassword('');
        localStorage.removeItem('adminPassword');
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else {
        setMessage(err.response?.data?.message || 'Randevular yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!isAuthenticated || !adminPassword) return;
    
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      setSettings(response.data);
      setMessage('');
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setAdminPassword('');
        localStorage.removeItem('adminPassword');
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else {
        setMessage(err.response?.data?.message || 'Ayarlar yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
    setShowModal(false);
  };

  const handleModalChange = (e) => {
    setSelectedAppointment({ ...selectedAppointment, [e.target.name]: e.target.value });
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;
    
    setLoading(true);
    try {
      const appointmentDate = selectedAppointment.appointmentDate;
      const appointmentTime = selectedAppointment.appointmentTime;
      
      const updatedAppointment = {
        ...selectedAppointment,
        appointmentDate,
        appointmentTime
      };
      
      await axios.put(`/api/admin/appointments/${selectedAppointment._id}`, updatedAppointment, {
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      await fetchAppointments();
      setMessage('Randevu başarıyla güncellendi');
      handleCloseModal();
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setAdminPassword('');
        localStorage.removeItem('adminPassword');
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else {
        setMessage(err.response?.data?.message || 'Randevu güncellenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment || !window.confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/admin/appointments/${selectedAppointment._id}`, {
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      await fetchAppointments();
      setMessage('Randevu başarıyla iptal edildi');
      handleCloseModal();
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setAdminPassword('');
        localStorage.removeItem('adminPassword');
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else {
        setMessage(err.response?.data?.message || 'Randevu iptal edilirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('/api/admin/settings', settings, {
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      setMessage('Ayarlar başarıyla güncellendi');
      if (setSettings) setSettings(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Ayarlar güncellenirken bir hata oluştu');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword('');
    localStorage.removeItem('adminPassword');
  };

  const now = new Date();
  const filteredAppointments = appointments.filter(appt => {
    const appointmentDate = new Date(appt.start);
    if (tab === 'upcoming') return appointmentDate > now && appt.status !== 'cancelled';
    if (tab === 'pending') return appt.status === 'pending' && appt.status !== 'cancelled' && appointmentDate > now;
    if (tab === 'past') return appointmentDate <= now && appt.status !== 'cancelled';
    return true;
  });

  // Geçmiş randevuları tarihe göre sırala (en yeni en üstte)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (tab === 'past') {
      return new Date(b.start) - new Date(a.start);
    }
    return new Date(a.start) - new Date(b.start);
  });

  const handlePermanentDelete = async (appt) => {
    if (window.confirm('Bu randevuyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await axios.delete(`/api/admin/appointments/${appt._id}/permanent`, {
          headers: { 'Authorization': `Bearer ${adminPassword}` }
        });
        setAppointments(prev => prev.filter(a => a._id !== appt._id));
        setEditMenuOpen(null);
        setSelectedAppointment(null);
        setMessage('Randevu kalıcı olarak silindi');
        await fetchAppointments();
      } catch (error) {
        setMessage(error.response?.data?.message || 'Randevu silinirken bir hata oluştu');
      }
    }
  };

  // Randevu kartı bileşeni
  const AppointmentCard = ({ appt }) => (
    <div className="d-flex align-items-center justify-content-between" 
         style={{ 
           background: '#f9fafb', 
           borderRadius: 16, 
           boxShadow: '0 1px 4px 0 rgba(37,99,235,0.07)', 
           padding: '18px 24px', 
           position: 'relative',
           opacity: tab === 'past' ? 0.8 : 1
         }}>
      <div className="d-flex align-items-center" style={{ gap: 18 }}>
        <div style={{ 
          minWidth: 48, 
          minHeight: 48, 
          background: tab === 'past' ? '#e9ecef' : '#e6edfa', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: 24, 
          color: tab === 'past' ? '#6c757d' : '#2563eb' 
        }}>
          <FaUser />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{appt.patientName}</div>
          <div style={{ fontSize: 15, color: tab === 'past' ? '#6c757d' : '#2563eb', fontWeight: 600 }}>
            <FaClock style={{ marginRight: 4 }} />
            {new Date(appt.start).toLocaleDateString('tr-TR', { 
              weekday: 'short', 
              day: '2-digit', 
              month: '2-digit', 
              year: '2-digit' 
            })} - {appt.appointmentTime}
          </div>
          {appt.notes && <div style={{ fontSize: 14, color: '#888' }}>{appt.notes}</div>}
          {appt.location && <div style={{ fontSize: 14, color: '#888' }}><FaMapMarkerAlt style={{ marginRight: 4 }} />{appt.location}</div>}
          {tab === 'past' && (
            <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
              Geçmiş Randevu
            </div>
          )}
        </div>
      </div>
      <div className="d-flex align-items-center" style={{ gap: 12 }}>
        {appt.status === 'pending' && tab !== 'past' && <span className="badge bg-warning text-dark">Bekliyor</span>}
        {tab === 'past' && <span className="badge bg-secondary">Geçmiş</span>}
        {appt.status === 'confirmed' && <span className="badge bg-success"><FaCheckCircle style={{ marginRight: 4 }} />Onaylandı</span>}
        {appt.status === 'cancelled' && <span className="badge bg-danger"><FaTimesCircle style={{ marginRight: 4 }} />İptal</span>}
        {(tab !== 'past') && (
          <div style={{ position: 'relative' }}>
            <button className="btn btn-light" style={{ borderRadius: 8 }} onClick={() => setEditMenuOpen(editMenuOpen === appt._id ? null : appt._id)}>
              <FaEllipsisV />
            </button>
            {editMenuOpen === appt._id && (
              <div style={{ position: 'absolute', right: 0, top: 40, background: '#fff', border: '1px solid #eee', borderRadius: 10, boxShadow: '0 2px 8px 0 rgba(37,99,235,0.07)', zIndex: 10, minWidth: 180 }}>
                <button className="dropdown-item" onClick={() => { setSelectedAppointment(appt); setShowModal(true); setEditMenuOpen(null); }}>Düzenle</button>
                <button className="dropdown-item text-danger" onClick={() => { setSelectedAppointment(appt); handleDeleteAppointment(); setEditMenuOpen(null); }}>İptal Et</button>
              </div>
            )}
          </div>
        )}
        {tab === 'past' && (
          <div style={{ position: 'relative' }}>
            <button className="btn btn-light" style={{ borderRadius: 8 }} onClick={() => setEditMenuOpen(editMenuOpen === appt._id ? null : appt._id)}>
              <FaEllipsisV />
            </button>
            {editMenuOpen === appt._id && (
              <div style={{ position: 'absolute', right: 0, top: 40, background: '#fff', border: '1px solid #eee', borderRadius: 10, boxShadow: '0 2px 8px 0 rgba(37,99,235,0.07)', zIndex: 10, minWidth: 180 }}>
                <button className="dropdown-item text-danger" onClick={() => { handlePermanentDelete(appt); setEditMenuOpen(null); }}>Kalıcı Sil</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const handleSearch = async () => {
    try {
      const response = await axios.get('/api/admin/appointments/search', {
        params: searchParams,
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      setAppointments(response.data);
      setShowSearchModal(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Arama yapılırken bir hata oluştu');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/appointments/stats', {
        params: {
          year: selectedYear,
          month: selectedMonth
        },
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      setStats(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card shadow p-4" style={{ maxWidth: 350, width: '100%' }}>
          <h2 className="text-center mb-4">Admin Girişi</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Şifre</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 position-relative" style={{ minHeight: '100vh', maxWidth: '100vw' }}>
      {/* Alert mesajı */}
      {message && <div className="alert alert-info text-center" style={{ maxWidth: 500, margin: '0 auto 18px auto' }}>{message}</div>}

      {/* Çıkış butonu sağ üstte, ekrana sabit */}
      {isAuthenticated && (
        <button className="btn btn-outline-primary position-fixed" style={{ top: 24, right: 36, zIndex: 1050 }} onClick={handleLogout}>
          Çıkış Yap
        </button>
      )}

      <ul className="nav nav-tabs mb-4" style={{ maxWidth: 700, margin: '0 auto' }}>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            Takvim
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'blocked' ? 'active' : ''}`}
            onClick={() => setActiveTab('blocked')}
          >
            Müsaitlik Yönetimi
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Ayarlar
          </button>
        </li>
      </ul>

      {activeTab === 'calendar' && (
        <div className="card shadow p-4 mb-5 bg-white rounded" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', minHeight: 500 }}>
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4" style={{ gap: 12 }}>
            <h3 className="mb-0" style={{ fontWeight: 800, fontSize: 26 }}>Randevular</h3>
          </div>

          <div className="d-flex justify-content-center mb-3" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className={`btn btn-light px-3 py-1${tab === 'upcoming' ? ' border-primary text-primary fw-bold' : ''}`} onClick={() => setTab('upcoming')}>Yaklaşan</button>
            <button className={`btn btn-light px-3 py-1${tab === 'pending' ? ' border-warning text-warning fw-bold' : ''}`} onClick={() => setTab('pending')}>Bekleyen</button>
            <button className={`btn btn-light px-3 py-1${tab === 'past' ? ' border-secondary text-secondary fw-bold' : ''}`} onClick={() => setTab('past')}>Geçmiş</button>
          </div>

          {sortedAppointments.length === 0 && <div className="text-muted text-center">Bu sekmede randevu yok.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sortedAppointments.map((appt) => (
              <AppointmentCard key={appt._id || appt.token} appt={appt} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'blocked' && (
        <AdminBlockedSlots />
      )}

      {showModal && selectedAppointment && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Randevu Düzenle</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Ad Soyad</label>
                  <input
                    type="text"
                    className="form-control"
                    name="patientName"
                    value={selectedAppointment.patientName}
                    onChange={handleModalChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-control"
                    name="patientEmail"
                    value={selectedAppointment.patientEmail}
                    onChange={handleModalChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="patientPhone"
                    value={selectedAppointment.patientPhone}
                    onChange={handleModalChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Tarih</label>
                  <input
                    type="date"
                    className="form-control"
                    name="appointmentDate"
                    value={selectedAppointment.appointmentDate?.slice(0,10)}
                    onChange={handleModalChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Saat</label>
                  <input
                    type="time"
                    className="form-control"
                    name="appointmentTime"
                    value={selectedAppointment.appointmentTime}
                    onChange={handleModalChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notlar</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={selectedAppointment.notes}
                    onChange={handleModalChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger me-auto" onClick={handleDeleteAppointment}>Sil</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Kapat</button>
                <button type="button" className="btn btn-primary" onClick={handleUpdateAppointment}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSearchModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Randevu Ara</h5>
                <button type="button" className="btn-close" onClick={() => setShowSearchModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Hasta Adı</label>
                  <input
                    type="text"
                    className="form-control"
                    value={searchParams.patientName}
                    onChange={(e) => setSearchParams({ ...searchParams, patientName: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    value={searchParams.startDate}
                    onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Bitiş Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    value={searchParams.endDate}
                    onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Durum</label>
                  <select
                    className="form-control"
                    value={searchParams.status}
                    onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
                  >
                    <option value="">Tümü</option>
                    <option value="pending">Bekliyor</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSearchModal(false)}>Kapat</button>
                <button type="button" className="btn btn-primary" onClick={handleSearch}>Ara</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Randevu İstatistikleri</h5>
                <button type="button" className="btn-close" onClick={() => setShowStatsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Yıl</label>
                    <select
                      className="form-control"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ay</label>
                    <select
                      className="form-control"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Ay/Yıl</th>
                        <th>Toplam</th>
                        <th>Bekleyen</th>
                        <th>Onaylandı</th>
                        <th>İptal Edildi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((stat, index) => (
                        <tr key={index}>
                          <td>{stat._id.month}/{stat._id.year}</td>
                          <td>{stat.total}</td>
                          <td>{stat.stats.find(s => s.status === 'pending')?.count || 0}</td>
                          <td>{stat.stats.find(s => s.status === 'confirmed')?.count || 0}</td>
                          <td>{stat.stats.find(s => s.status === 'cancelled')?.count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatsModal(false)}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <form onSubmit={handleUpdateSettings} className="card shadow p-4 mb-5 bg-white rounded">
          <div className="mb-3">
            <label className="form-label">Site Başlığı</label>
            <input
              type="text"
              className="form-control"
              value={settings.siteTitle}
              onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
            />
          </div>
          <div className="mb-3 d-flex justify-content-center align-items-center" style={{ gap: 32 }}>
            <div className="text-center">
              <label className="form-label">Ana Renk</label>
              <input
                type="color"
                className="form-control form-control-color mx-auto"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                style={{ width: 40, height: 40 }}
              />
            </div>
            <div className="text-center">
              <label className="form-label">İkincil Renk</label>
              <input
                type="color"
                className="form-control form-control-color mx-auto"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                style={{ width: 40, height: 40 }}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Yazı Tipi</label>
            <input
              type="text"
              className="form-control"
              value={settings.fontFamily}
              onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Hakkımda İçeriği</label>
            <Editor
              apiKey="sfm68p0gxkywosw5qi9p3743d3eb16yz5cgi25dhmh5e71cg"
              value={settings.aboutContent || ''}
              init={{
                height: 250,
                menubar: false,
                plugins: [
                  'advlist autolink lists link image charmap preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code help wordcount',
                  'image'
                ],
                toolbar:
                  'undo redo | formatselect | fontselect fontsizeselect | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | removeformat | help',
                fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt',
                content_style:
                  'body { font-family:Arial,sans-serif; font-size:16px }',
                images_upload_handler: (blobInfo, success, failure) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(blobInfo.blob());
                  reader.onloadend = () => {
                    success(reader.result);
                  };
                  reader.onerror = () => {
                    failure('Resim yüklenemedi');
                  };
                },
                image_title: true,
                automatic_uploads: true,
                file_picker_types: '',
              }}
              onEditorChange={content => setSettings({ ...settings, aboutContent: content })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Arka Plan Görseli URL</label>
            <input
              type="text"
              className="form-control"
              value={settings.backgroundImage}
              onChange={(e) => setSettings({ ...settings, backgroundImage: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Whatsapp Linki</label>
            <input
              type="text"
              className="form-control"
              value={settings.whatsapp || ''}
              onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
              placeholder="https://wa.me/5xxxxxxxxx"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Instagram Linki</label>
            <input
              type="text"
              className="form-control"
              value={settings.instagram || ''}
              onChange={e => setSettings({ ...settings, instagram: e.target.value })}
              placeholder="https://instagram.com/kullaniciadi"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Ayarları Kaydet
          </button>
        </form>
      )}
    </div>
  );
};

export default Admin; 