import { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import tr from 'date-fns/locale/tr';

const steps = [
  { title: 'Kişisel Bilgiler' },
  { title: 'Tarih & Saat' },
  { title: 'Onay' }
];

const Appointment = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    notes: '',
    appointmentDate: '',
    appointmentTime: ''
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [occupiedTimes, setOccupiedTimes] = useState([]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'patientPhone') {
      const cleaned = value.replace(/[^0-9]/g, '').slice(0, 11);
      setFormData({ ...formData, [name]: cleaned });
      setPhoneError(cleaned.length < 10 ? 'Telefon numarası en az 10 haneli olmalı' : '');
    } else if (name === 'patientEmail') {
      setFormData({ ...formData, [name]: value });
      setEmailError(validateEmail(value) ? '' : 'Geçerli bir e-posta adresi giriniz');
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      setFormData({ ...formData, appointmentDate: `${year}-${month}-${day}` });
    } else {
      setFormData({ ...formData, appointmentDate: '' });
    }
  };

  const handleNext = () => {
    if (step === 0) {
      if (!formData.patientName || !formData.patientEmail || !formData.patientPhone) {
        setMessage('Lütfen tüm kişisel bilgileri doldurun.');
        return;
      }
      if (!validateEmail(formData.patientEmail)) {
        setEmailError('Geçerli bir e-posta adresi giriniz');
        return;
      }
      if (formData.patientPhone.length < 10) {
        setPhoneError('Telefon numarası en az 10 haneli olmalı');
        return;
      }
    }
    if (step === 1) {
      if (!formData.appointmentDate || !formData.appointmentTime) {
        setMessage('Lütfen tarih ve saat seçin.');
        return;
      }
    }
    setMessage('');
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
    setMessage('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const cleanedData = {
        patientName: formData.patientName.trim(),
        patientEmail: formData.patientEmail.trim(),
        patientPhone: formData.patientPhone.trim(),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        notes: formData.notes.trim()
      };
      const response = await axios.post('/api/appointments', cleanedData);
      if (response.data.success) {
        setCode(response.data.data.code);
        let msg = response.data.message || 'Randevunuz başarıyla oluşturuldu!';
        if (response.data.emailError) {
          msg += ` (E-posta gönderilemedi: ${response.data.emailError})`;
        }
        setMessage(msg);
        setStep(0);
        setFormData({
          patientName: '',
          patientEmail: '',
          patientPhone: '',
          notes: '',
          appointmentDate: '',
          appointmentTime: ''
        });
        setSelectedDate(null);
      } else {
        setMessage(response.data.message || 'Randevu oluşturulurken bir hata oluştu.');
        setCode('');
        setStep(1);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Randevu oluşturulurken bir hata oluştu.');
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`/api/appointments/${searchCode}`);
      setAppointment(response.data);
      setMessage('');
    } catch {
      setMessage('Randevu bulunamadı.');
      setAppointment(null);
    }
  };

  // Sağdaki özet kutusu
  const Summary = () => (
    <div className="card shadow-sm summary-card">
      <div className="card-body">
        <h5 className="card-title mb-3">Seçiminiz</h5>
        <div><b>Ad Soyad:</b> {formData.patientName || <span className="text-muted">-</span>}</div>
        <div><b>E-posta:</b> {formData.patientEmail || <span className="text-muted">-</span>}</div>
        <div><b>Telefon:</b> {formData.patientPhone || <span className="text-muted">-</span>}</div>
        <div><b>Tarih:</b> {formData.appointmentDate ? formData.appointmentDate.split('-').reverse().join('.') : <span className="text-muted">-</span>}</div>
        <div><b>Saat:</b> {formData.appointmentTime || <span className="text-muted">-</span>}</div>
        <div><b>Not:</b> {formData.notes || <span className="text-muted">-</span>}</div>
      </div>
    </div>
  );

  // Adım göstergesi
  const Stepper = () => (
    <div className="d-flex align-items-center justify-content-center mb-4" style={{ gap: 32 }}>
      {steps.map((s, i) => (
        <div key={i} className="text-center" style={{ flex: 1 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: i <= step ? '#2563eb' : '#e6edfa',
            color: i <= step ? '#fff' : '#2563eb',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 20,
            marginBottom: 6,
            border: i === step ? '2px solid #2563eb' : '2px solid #e6edfa',
            transition: 'all 0.2s'
          }}>{i + 1}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: i === step ? '#2563eb' : '#888' }}>{s.title}</div>
        </div>
      ))}
    </div>
  );

  // Saat seçeneklerini oluştur (09:00-17:00, 60 dakika aralıklarla)
  const timeOptions = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDateObj = formData.appointmentDate ? new Date(formData.appointmentDate) : null;
  const isToday = selectedDateObj && 
    selectedDateObj.getFullYear() === today.getFullYear() && 
    selectedDateObj.getMonth() === today.getMonth() && 
    selectedDateObj.getDate() === today.getDate();

  for (let h = 9; h <= 17; h++) {
    for (let m = 0; m < 60; m += 60) {
      if (h === 17 && m > 0) break;
      
      // Eğer bugünse ve saat geçmişse veya 1 saatten yakınsa, bu saati listeye ekleme
      if (isToday) {
        // Şu anki saatten küçük olanları gösterme
        if (h < currentHour) continue;
        
        // Şu anki saat ile aynıysa ve dakika geçmişse gösterme
        if (h === currentHour && m <= currentMinute) continue;
        
        // Şu anki zamandan 1 saatten daha yakın olanları gösterme
        const timeInMinutes = h * 60 + m;
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        if (timeInMinutes - currentTimeInMinutes < 60) continue;
      }

      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  // Tarih seçildiğinde dolu saatleri çek
  useEffect(() => {
    const fetchOccupiedTimes = async () => {
      if (!formData.appointmentDate) {
        setOccupiedTimes([]);
        return;
      }
      try {
        const res = await axios.get(`/api/appointments/occupied?date=${formData.appointmentDate}`);
        if (res.data.success) {
          setOccupiedTimes(res.data.times);
        } else {
          setOccupiedTimes([]);
        }
      } catch {
        setOccupiedTimes([]);
      }
    };
    fetchOccupiedTimes();
  }, [formData.appointmentDate]);

  return (
    <div className="container py-4" style={{ maxWidth: 1100 }}>
      <div className="row g-4 align-items-start">
        <div className="col-lg-7">
          <div className="card shadow-sm p-4 mb-4">
            <Stepper />
            {code && (
              <div className="alert alert-success text-center">Randevu Kodunuz: <b>{code}</b></div>
            )}
            {message && (
              <div className="alert alert-info text-center" style={{ whiteSpace: 'pre-line' }}>
                {message}
                {message.includes('Randevu Kodunuz:') ? null : (code && (
                  <div style={{ marginTop: 8 }}>
                    <b>Randevu Kodunuz: <span style={{ color: '#2563eb', fontSize: 18 }}>{code}</span></b>
                  </div>
                ))}
              </div>
            )}
            {step === 0 && (
              <>
                <div className="mb-3">
                  <label className="form-label">Ad Soyad</label>
                  <input type="text" className="form-control" name="patientName" value={formData.patientName} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">E-posta</label>
                  <input type="email" className="form-control" name="patientEmail" value={formData.patientEmail} onChange={handleChange} required />
                  {emailError && <div className="text-danger small">{emailError}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Telefon</label>
                  <input type="tel" className="form-control" name="patientPhone" value={formData.patientPhone} onChange={handleChange} required />
                  {phoneError && <div className="text-danger small">{phoneError}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Notlar</label>
                  <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} />
                </div>
                <div className="d-flex justify-content-end">
                  <button className="btn btn-primary" type="button" onClick={handleNext}>İleri</button>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <div className="appointment-form-group">
                  <label className="appointment-form-label">Tarih</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="Tarih seçin"
                    locale={tr}
                    className="form-control"
                    autoComplete="off"
                    isClearable
                    minDate={new Date()}
                  />
                </div>
                <div className="appointment-form-group">
                  <label className="appointment-form-label">Saat</label>
                  <select
                    className="form-control"
                    value={formData.appointmentTime}
                    onChange={e => setFormData({ ...formData, appointmentTime: e.target.value })}
                    required
                  >
                    <option value="">Saat seçin</option>
                    {timeOptions.filter(time => !occupiedTimes.includes(time)).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="d-flex justify-content-between">
                  <button className="btn btn-outline-secondary" type="button" onClick={handlePrev}>Geri</button>
                  <button className="btn btn-primary" type="button" onClick={handleNext}>İleri</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <Summary />
                <div className="d-flex justify-content-between mt-4">
                  <button className="btn btn-outline-secondary" type="button" onClick={handlePrev}>Geri</button>
                  <button className="btn btn-success" type="button" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Gönderiliyor...' : 'Randevuyu Onayla'}
                  </button>
                </div>
              </>
            )}
            <hr className="my-4" />
            <h5 className="mb-3">Randevu Sorgula</h5>
            <form onSubmit={handleSearch} className="mb-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Randevu Kodunuzu Girin"
                  value={searchCode}
                  onChange={e => setSearchCode(e.target.value)}
                  required
                />
                <button className="btn btn-primary" type="submit">Sorgula</button>
              </div>
            </form>
            {appointment && (
              <div className="card mt-3">
                <div className="card-body text-center">
                  <h6 className="card-title mb-3">Randevu Detayları</h6>
                  <div><b>Ad Soyad:</b> {appointment.patientName}</div>
                  <div><b>Tarih:</b> {new Date(appointment.appointmentDate).toLocaleDateString('tr-TR')}</div>
                  <div><b>Saat:</b> {appointment.appointmentTime}</div>
                  <div className="mt-3" style={{ fontWeight: 600, color: '#2563eb' }}>Sağlıklı Günler Dileriz :)</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-5">
          <Summary />
        </div>
      </div>
    </div>
  );
};

export default Appointment; 