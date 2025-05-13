import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/tr';

const AppointmentForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
    });
    const [availableHours, setAvailableHours] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [token, setToken] = useState('');

    // Minimum tarih için UTC başlangıcını al
    const getMinDate = () => {
        return moment().format('YYYY-MM-DD');
    };

    // Seçilen zaman slotunun geçerli olup olmadığını kontrol et
    const isTimeSlotValid = (timeSlot) => {
        if (!formData.date || !timeSlot) return false;

        const selectedDateTime = moment(`${formData.date} ${timeSlot}`, 'YYYY-MM-DD HH:mm');
        const now = moment();
        
        // Bugünün tarihi ile seçilen tarihi karşılaştır
        const today = moment().startOf('day');
        const selectedDate = moment(formData.date).startOf('day');

        // Eğer seçilen tarih bugünden önceyse geçersiz
        if (selectedDate.isBefore(today)) {
            return false;
        }

        // Eğer seçilen tarih bugünse, saat kontrolü yap
        if (selectedDate.isSame(today)) {
            // Şu anki saatten en az 1 saat sonrası için randevu alınabilir
            return selectedDateTime.diff(now, 'minutes') >= 60;
        }

        // Gelecek tarihler için geçerli
        return true;
    };

    // Saatleri periyodik olarak güncelle
    useEffect(() => {
        const fetchAvailableHours = async () => {
            if (formData.date) {
                try {
                    const response = await fetch(`/api/appointments/available-times/${formData.date}`);
                    if (!response.ok) {
                        throw new Error('Sunucu hatası');
                    }
                    const data = await response.json();
                    
                    // API'den gelen saatleri client-side'da da filtrele
                    const filteredSlots = data.availableSlots.filter(isTimeSlotValid);
                    setAvailableHours(filteredSlots);
                    
                    // Eğer seçili saat artık müsait değilse, seçimi temizle
                    if (!filteredSlots.includes(formData.time)) {
                        setFormData(prev => ({ ...prev, time: '' }));
                        if (formData.time) {
                            setError('Seçili saat artık müsait değil');
                        }
                    }
                } catch (error) {
                    console.error('Müsait saatler getirilirken hata:', error);
                    setError('Müsait saatler alınamadı');
                }
            } else {
                setAvailableHours([]);
            }
        };

        fetchAvailableHours();

        // Her 30 saniyede bir güncelle
        const interval = setInterval(fetchAvailableHours, 30000);
        return () => clearInterval(interval);
    }, [formData.date]);

    // Form alanları değiştiğinde
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setError('');
        setToken('');
        
        if (name === 'date') {
            // Tarih değiştiğinde saati sıfırla
            setFormData(prev => ({ ...prev, [name]: value, time: '' }));
        } else if (name === 'time') {
            // Saat seçiminde ekstra kontrol
            if (!isTimeSlotValid(value)) {
                setError('Geçersiz randevu saati. Lütfen en az 1 saat sonrası için randevu alın.');
                return;
            }
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Form gönderildiğinde
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        setToken('');

        try {
            // Son bir kez daha kontrol et
            if (!isTimeSlotValid(formData.time)) {
                throw new Error('Geçersiz randevu saati. Lütfen en az 1 saat sonrası için randevu alın.');
            }

            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Randevu oluşturulurken bir hata oluştu');
            }

            // Başarılı
            setToken(data.token);
            alert(`Randevunuz başarıyla oluşturuldu! Randevu takip kodunuz: ${data.token}`);
            setFormData({
                name: '',
                email: '',
                phone: '',
                date: '',
                time: '',
            });
        } catch (error) {
            console.error('Randevu oluşturma hatası:', error);
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Token ile randevu sorgula
    const handleTokenQuery = async (e) => {
        e.preventDefault();
        if (!token) {
            setError('Lütfen randevu takip kodunuzu girin');
            return;
        }

        try {
            const response = await fetch(`/api/appointments/${token}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Randevu bulunamadı');
            }

            // Randevu bilgilerini göster
            alert(`
                Randevu Bilgileri:
                Ad Soyad: ${data.name}
                Tarih: ${moment(data.date).format('DD.MM.YYYY')}
                Saat: ${moment(data.date).format('HH:mm')}
                Durum: ${data.status === 'active' ? 'Aktif' : 'İptal Edildi'}
            `);
        } catch (error) {
            console.error('Randevu sorgulama hatası:', error);
            setError(error.message);
        }
    };

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-md-6">
                    <h3>Randevu Oluştur</h3>
                    <form onSubmit={handleSubmit} className="appointment-form">
                        {error && (
                            <div className="alert alert-danger mb-3" role="alert">
                                {error}
                            </div>
                        )}
                        
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">Ad Soyad</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">E-posta</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label">Telefon</label>
                            <input
                                type="tel"
                                className="form-control"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="date" className="form-label">Tarih</label>
                            <input
                                type="date"
                                className="form-control"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                min={getMinDate()}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="time" className="form-label">Saat</label>
                            <select
                                className="form-control"
                                id="time"
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                                disabled={!formData.date || availableHours.length === 0}
                                required
                            >
                                <option value="">Saat seçiniz</option>
                                {availableHours.map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                            <small className="text-muted d-block mt-1">
                                * Randevu saati şu andan en az 1 saat sonra olmalıdır
                            </small>
                            <small className="text-muted d-block">
                                * Müsait saatler otomatik olarak güncellenmektedir
                            </small>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || !formData.date || !formData.time}
                        >
                            {isSubmitting ? 'Gönderiliyor...' : 'Randevu Oluştur'}
                        </button>
                    </form>
                </div>

                <div className="col-md-6">
                    <h3>Randevu Sorgula</h3>
                    <form onSubmit={handleTokenQuery} className="query-form">
                        <div className="mb-3">
                            <label htmlFor="token" className="form-label">Randevu Takip Kodu</label>
                            <input
                                type="text"
                                className="form-control"
                                id="token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Randevu takip kodunuzu girin"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary">
                            Randevu Sorgula
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AppointmentForm; 