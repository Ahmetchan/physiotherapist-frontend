import { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import tr from 'date-fns/locale/tr';

const timeOptions = [];
for (let h = 9; h <= 17; h++) {
  for (let m = 0; m < 60; m += 60) {
    if (h === 17 && m > 0) break;
    const hour = h.toString().padStart(2, '0');
    const minute = m.toString().padStart(2, '0');
    timeOptions.push(`${hour}:${minute}`);
  }
}

export default function AdminBlockedSlots() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });

  // Admin şifresini localStorage'dan al
  const adminPassword = localStorage.getItem('adminPassword');

  // API çağrıları için ortak axios instance
  const api = axios.create({
    headers: {
      'Authorization': `Bearer ${adminPassword}`,
      'Content-Type': 'application/json'
    }
  });

  // Tüm engellenmiş saatleri getir
  const fetchAllBlockedSlots = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/blocked-slots/all');
      
      // Gelen veriyi doğru formata dönüştür ve sadece bugün ve sonrası için olanları filtrele
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const formattedSlots = response.data.slots
        .map(slot => ({
          ...slot,
          date: slot.date.split('T')[0], // ISO formatından YYYY-MM-DD formatına dönüştür
          fullDate: new Date(slot.date)
        }))
        .filter(slot => new Date(slot.date) >= today)
        .sort((a, b) => a.fullDate - b.fullDate);

      setBlockedSlots(formattedSlots);
      setMessage({ text: '', type: 'info' });
    } catch (error) {
      console.error('Engellenmiş saatler yüklenirken hata:', error);
      if (error.response?.status === 401) {
        setMessage({ 
          text: 'Oturum süreniz dolmuş olabilir. Lütfen yeniden giriş yapın.', 
          type: 'danger' 
        });
      } else {
        setMessage({ 
          text: 'Engellenmiş saatler yüklenirken hata oluştu.', 
          type: 'danger' 
        });
      }
      setBlockedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde ve her işlemden sonra verileri çek
  useEffect(() => {
    fetchAllBlockedSlots();
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setReason('');
  };

  const handleBlock = async () => {
    if (!selectedDate || !selectedTime) {
      setMessage({ text: 'Tarih ve saat seçin.', type: 'warning' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: 'info' });

    try {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const response = await api.post('/api/admin/blocked-slots', {
        date: dateStr,
        time: selectedTime,
        reason: reason.trim()
      });

      if (response.data.success) {
        setMessage({ text: 'Saat başarıyla engellendi.', type: 'success' });
        setSelectedTime('');
        setReason('');
        await fetchAllBlockedSlots();
      } else {
        throw new Error(response.data.message || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Saat engellenirken hata:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Saat engellenirken hata oluştu.', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu engeli kaldırmak istediğinize emin misiniz?')) return;
    
    setLoading(true);
    try {
      const response = await api.delete(`/api/admin/blocked-slots/${id}`);
      
      if (response.data.success) {
        setMessage({ text: 'Engel başarıyla kaldırıldı.', type: 'success' });
        await fetchAllBlockedSlots();
      } else {
        throw new Error(response.data.message || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Engel kaldırılırken hata:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Engel kaldırılırken hata oluştu.', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Seçili tarih için engellenmiş saatleri filtrele
  const getBlockedTimesForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return blockedSlots.filter(slot => slot.date === dateStr).map(slot => slot.time);
  };

  if (!adminPassword) {
    return (
      <div className="alert alert-danger">
        Yetkilendirme hatası. Lütfen yeniden giriş yapın.
      </div>
    );
  }

  const blockedTimesForSelectedDate = getBlockedTimesForSelectedDate();

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <h3 className="mb-4">Müsaitlik Yönetimi (Saat Engelle)</h3>
      
      {message.text && (
        <div className={`alert alert-${message.type} mb-4`}>
          {message.text}
        </div>
      )}
      
      <div className="card p-3 mb-4">
        <div className="mb-3">
          <label className="form-label">Tarih</label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="dd.MM.yyyy"
            locale={tr}
            className="form-control"
            minDate={new Date()}
            placeholderText="Tarih seçin"
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Saat</label>
          <select 
            className="form-control" 
            value={selectedTime} 
            onChange={e => setSelectedTime(e.target.value)}
            disabled={loading}
          >
            <option value="">Saat seçin</option>
            {timeOptions.map(time => {
              const isBlocked = blockedTimesForSelectedDate.includes(time);
              return (
                <option key={time} value={time} disabled={isBlocked}>
                  {time} {isBlocked ? '(Engelli)' : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Açıklama (opsiyonel)</label>
          <input 
            type="text"
            className="form-control" 
            value={reason} 
            onChange={e => setReason(e.target.value)}
            placeholder="Engelleme sebebi (opsiyonel)"
            disabled={loading || !selectedTime}
          />
        </div>
        <button 
          className="btn btn-danger" 
          onClick={handleBlock} 
          disabled={loading || !selectedTime}
        >
          {loading ? 'İşleniyor...' : 'Saati Engelle'}
        </button>
      </div>

      <h5>Engellenmiş Saatler {loading && <small>(Yükleniyor...)</small>}</h5>
      <div className="list-group">
        {blockedSlots.length === 0 ? (
          <div className="list-group-item text-muted">
            {loading ? 'Yükleniyor...' : 'Engellenmiş saat bulunmuyor'}
          </div>
        ) : (
          blockedSlots.map(slot => (
            <div key={slot._id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <b>{new Date(slot.date).toLocaleDateString('tr-TR')}</b> - <b>{slot.time}</b>
                {slot.reason && <small className="text-muted ms-2">({slot.reason})</small>}
              </div>
              <button 
                className="btn btn-sm btn-outline-danger" 
                onClick={() => handleDelete(slot._id)}
                disabled={loading}
              >
                {loading ? '...' : 'Kaldır'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 