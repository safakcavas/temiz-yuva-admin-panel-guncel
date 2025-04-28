import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Badge, Spinner, Alert, Form, Row, Col, InputGroup, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faCalendarAlt,
  faSearch,
  faSync,
  faEye,
  faPencilAlt,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faList,
  faCreditCard,
  faMoneyBill,
  faEnvelope,
  faStar,
  faPlus,
  faDollarSign
} from '@fortawesome/free-solid-svg-icons';
import './ReservationsPage.css';

// Rezervasyon tipi
interface Reservation {
  id: number;
  userId: number | null;
  userFullName: string;
  email: string;
  phone: string;
  serviceId: number | null;
  serviceTitle: string;
  addressId: number | null;
  addressTitle: string;
  addressFullAddress: string;
  reservationDate: string;
  startTime: string;
  endTime: string | null;
  notes: string;
  status: string | number;
  statusText?: string;
  paymentStatus: string | number;
  paymentStatusText?: string;
  paymentMethod: string | number;
  paymentMethodText?: string;
  rejectionReason: string | null;
  cancellationReason: string | null;
  price: number;
  discountAmount: number;
  discountPercentage: number;
  prepaidAmount: number;
  callCenterPaymentAmount?: number;
  paymentNote?: string;
  finalPrice: number;
  paidTotal: number;
  remainingAmount: number;
  servicePrice?: string;
  createdAt: string;
  updatedAt: string | null;
  paymentDate: string | null;
  platform?: string;
}

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [reminderSending, setReminderSending] = useState<{ [key: number]: boolean }>({});
  const [ratingSending, setRatingSending] = useState<{ [key: number]: boolean }>({});
  const navigate = useNavigate();

  // Renk paleti
  const colors = {
    primary: '#0a6c3c',
    secondary: '#174',
    light: '#e8f5e9',
    dark: 'hsl(150,83%,23%)',
    warning: '#ffc107',
    danger: '#dc3545',
    success: '#198754',
    info: '#0dcaf0'
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reservations, searchTerm, statusFilter, paymentStatusFilter, dateFilter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/Reservations/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("API yanıtı:", response.data);

      // API yanıtını dönüştür
      let reservationsData = response.data;
      
      // Eğer isSuccess ve reservations formatındaysa içinden çıkar
      if (response.data && response.data.isSuccess && response.data.reservations) {
        reservationsData = response.data.reservations;
      }

      // Veri formatını normalize et
      const normalizedReservations = reservationsData.map((reservation: any) => {
        // Status string veya number olabileceği için kontrol et
        let statusNumber = 0;
        let statusText = '';
        
        if (typeof reservation.status === 'string') {
          statusText = reservation.status;
          switch (reservation.status) {
            case 'Pending': statusNumber = 0; break;
            case 'Approved': statusNumber = 1; break;
            case 'Rejected': statusNumber = 2; break;
            case 'Canceled': statusNumber = 3; break;
            case 'Completed': statusNumber = 4; break;
            default: statusNumber = 0;
          }
        } else if (typeof reservation.status === 'number') {
          statusNumber = reservation.status;
          statusText = reservation.statusText || '';
        }
        
        // Payment status string veya number olabileceği için kontrol et
        let paymentStatusNumber = 0;
        let paymentStatusText = '';
        
        if (typeof reservation.paymentStatus === 'string') {
          paymentStatusText = reservation.paymentStatus;
          switch (reservation.paymentStatus) {
            case 'NotPaid': paymentStatusNumber = 0; break;
            case 'PartiallyPaid': paymentStatusNumber = 1; break;
            case 'FullyPaid': paymentStatusNumber = 2; break;
            default: paymentStatusNumber = 0;
          }
        } else if (typeof reservation.paymentStatus === 'number') {
          paymentStatusNumber = reservation.paymentStatus;
          paymentStatusText = reservation.paymentStatusText || '';
        }
        
        // Payment method string veya number olabileceği için kontrol et
        let paymentMethodNumber = 0;
        let paymentMethodText = '';
        
        if (typeof reservation.paymentMethod === 'string') {
          paymentMethodText = reservation.paymentMethod;
          switch (reservation.paymentMethod) {
            case 'None': paymentMethodNumber = 0; break;
            case 'CreditCard': paymentMethodNumber = 1; break;
            case 'Cash': paymentMethodNumber = 2; break;
            case 'BankTransfer': paymentMethodNumber = 3; break;
            default: paymentMethodNumber = 0;
          }
        } else if (typeof reservation.paymentMethod === 'number') {
          paymentMethodNumber = reservation.paymentMethod;
          paymentMethodText = reservation.paymentMethodText || '';
        }
        
        return {
          ...reservation,
          status: statusNumber,
          statusText: statusText,
          paymentStatus: paymentStatusNumber,
          paymentStatusText: paymentStatusText,
          paymentMethod: paymentMethodNumber,
          paymentMethodText: paymentMethodText
        };
      });
      
      setReservations(normalizedReservations);
      
    } catch (error) {
      console.error('Rezervasyonlar alınamadı:', error);
      setError('Rezervasyonlar yüklenirken bir hata oluştu.');
      
      // Hata durumunda örnek verilerle devam edelim
      setReservations([
        {
          id: 1,
          userId: 1,
          userFullName: 'Ahmet Yılmaz',
          email: 'ahmet@example.com',
          phone: '+905551234567',
          serviceId: 1,
          serviceTitle: 'Ev Temizliği',
          addressId: 1,
          addressTitle: 'Ev',
          addressFullAddress: 'Kadıköy, İstanbul',
          reservationDate: '2025-06-15T00:00:00Z',
          startTime: '10:00:00',
          endTime: null,
          notes: 'Lütfen sabah 10:00\'da gelin.',
          status: 0,
          statusText: 'Pending',
          paymentStatus: 0,
          paymentStatusText: 'NotPaid',
          paymentMethod: 0,
          paymentMethodText: 'None',
          rejectionReason: null,
          cancellationReason: null,
          price: 350,
          discountAmount: 0,
          discountPercentage: 0,
          prepaidAmount: 0,
          finalPrice: 350,
          paidTotal: 0,
          remainingAmount: 350,
          createdAt: '2024-04-01T14:30:00Z',
          updatedAt: null,
          paymentDate: null
        },
        {
          id: 2,
          userId: 2,
          userFullName: 'Ayşe Demir',
          email: 'ayse@example.com',
          phone: '+905552345678',
          serviceId: 2,
          serviceTitle: 'Ofis Temizliği',
          addressId: 2,
          addressTitle: 'Ofis',
          addressFullAddress: 'Şişli, İstanbul',
          reservationDate: '2025-06-20T00:00:00Z',
          startTime: '14:00:00',
          endTime: null,
          notes: 'Öğleden sonra 14:00\'da bekliyoruz.',
          status: 1,
          statusText: 'Approved',
          paymentStatus: 0,
          paymentStatusText: 'NotPaid',
          paymentMethod: 0,
          paymentMethodText: 'None',
          rejectionReason: null,
          cancellationReason: null,
          price: 550,
          discountAmount: 0,
          discountPercentage: 0,
          prepaidAmount: 0,
          finalPrice: 550,
          paidTotal: 0,
          remainingAmount: 550,
          createdAt: '2024-04-05T10:15:00Z',
          updatedAt: null,
          paymentDate: null
        },
        {
          id: 3,
          userId: 3,
          userFullName: 'Mehmet Kaya',
          email: 'mehmet@example.com',
          phone: '+905553456789',
          serviceId: 1,
          serviceTitle: 'Ev Temizliği',
          addressId: 3,
          addressTitle: 'Yazlık',
          addressFullAddress: 'Beşiktaş, İstanbul',
          reservationDate: '2025-05-10T00:00:00Z',
          startTime: '09:00:00',
          endTime: '12:00:00',
          notes: 'Sabah 9\'da gelebilirsiniz.',
          status: 4,
          statusText: 'Completed',
          paymentStatus: 2,
          paymentStatusText: 'FullyPaid',
          paymentMethod: 2,
          paymentMethodText: 'CreditCard',
          rejectionReason: null,
          cancellationReason: null,
          price: 400,
          discountAmount: 0,
          discountPercentage: 0,
          prepaidAmount: 0,
          finalPrice: 400,
          paidTotal: 400,
          remainingAmount: 0,
          createdAt: '2024-03-20T11:45:00Z',
          updatedAt: null,
          paymentDate: '2024-05-10T12:00:00Z'
        },
        {
          id: 4,
          userId: 4,
          userFullName: 'Zeynep Yıldız',
          email: 'zeynep@example.com',
          phone: '+905554567890',
          serviceId: 3,
          serviceTitle: 'Cam Temizliği',
          addressId: 4,
          addressTitle: 'Daire',
          addressFullAddress: 'Ataşehir, İstanbul',
          reservationDate: '2025-05-05T00:00:00Z',
          startTime: '11:00:00',
          endTime: null,
          notes: '',
          status: 3,
          statusText: 'Canceled',
          paymentStatus: 0,
          paymentStatusText: 'NotPaid',
          paymentMethod: 0,
          paymentMethodText: 'None',
          rejectionReason: null,
          cancellationReason: 'Müsait olmadığım için iptal etmek istiyorum.',
          price: 250,
          discountAmount: 0,
          discountPercentage: 0,
          prepaidAmount: 0,
          finalPrice: 250,
          paidTotal: 0,
          remainingAmount: 250,
          createdAt: '2024-03-25T13:20:00Z',
          updatedAt: null,
          paymentDate: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reservations];
    
    // Durum filtresi
    if (statusFilter !== null) {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }
    
    // Ödeme durumu filtresi
    if (paymentStatusFilter !== null) {
      filtered = filtered.filter(reservation => reservation.paymentStatus === paymentStatusFilter);
    }
    
    // Tarih filtresi
    if (dateFilter) {
      const reservationDateStr = dateFilter;
      filtered = filtered.filter(reservation => {
        const reservationDate = new Date(reservation.reservationDate);
        const formattedDate = reservationDate.toISOString().split('T')[0];
        return formattedDate === reservationDateStr;
      });
    }
    
    // Arama filtresi
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reservation => 
        reservation.userFullName.toLowerCase().includes(term) || 
        reservation.serviceTitle.toLowerCase().includes(term) || 
        reservation.phone.includes(term) ||
        reservation.addressTitle.toLowerCase().includes(term) ||
        reservation.id.toString().includes(term)
      );
    }
    
    setFilteredReservations(filtered);
  };

  const resetFilters = () => {
    setStatusFilter(null);
    setPaymentStatusFilter(null);
    setDateFilter('');
    setSearchTerm('');
  };

  const sendReminderEmail = async (reservationId: number) => {
    try {
      setReminderSending(prev => ({ ...prev, [reservationId]: true }));
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/admin/reservations/${reservationId}/send-reminder`, null, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      alert('Hatırlatma e-postası başarıyla gönderildi!');
    } catch (error) {
      console.error('Hatırlatma e-postası gönderilemedi:', error);
      alert('Hatırlatma e-postası gönderilirken bir hata oluştu.');
    } finally {
      setReminderSending(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  const sendRatingReminder = async (reservationId: number) => {
    try {
      setRatingSending(prev => ({ ...prev, [reservationId]: true }));
      const token = localStorage.getItem('token');
      
      // Doğru endpoint: /admin/reservations/{id}/send-rating-reminder
      console.log(`Değerlendirme hatırlatması gönderiliyor. ID: ${reservationId}`);
      
      await axios.post(`${API_BASE_URL}/ratings/send-email/${reservationId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      alert('Değerlendirme hatırlatma e-postası başarıyla gönderildi!');
    } catch (error) {
      console.error('Değerlendirme hatırlatma e-postası gönderilemedi:', error);
      alert('Değerlendirme hatırlatma e-postası gönderilirken bir hata oluştu.');
    } finally {
      setRatingSending(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  // Durum badge'i
  const getStatusBadge = (status: number | string, statusText: string) => {
    // Status string ise number'a çevir
    const statusNum = typeof status === 'string' 
      ? (['Pending', 'Approved', 'Rejected', 'Canceled', 'Completed'].indexOf(status))
      : status;
    
    switch (statusNum) {
      case 0: // Pending
        return <Badge bg="warning" className="status-badge">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
          <span>Beklemede</span>
        </Badge>;
      case 1: // Approved
        return <Badge bg="primary" className="status-badge">
          <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
          <span>Onaylandı</span>
        </Badge>;
      case 2: // Rejected
        return <Badge bg="dark" className="status-badge">
          <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
          <span>Reddedildi</span>
        </Badge>;
      case 3: // Canceled
        return <Badge bg="danger" className="status-badge">
          <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
          <span>İptal Edildi</span>
        </Badge>;
      case 4: // Completed
        return <Badge bg="success" className="status-badge">
          <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
          <span>Tamamlandı</span>
        </Badge>;
      default:
        return <Badge bg="secondary" className="status-badge">
          <FontAwesomeIcon icon={faList} className="me-1" />
          <span>Bilinmiyor</span>
        </Badge>;
    }
  };

  // Ödeme durumu badge'i
  const getPaymentStatusBadge = (status: number | string, statusText: string) => {
    // Status string ise number'a çevir
    const statusNum = typeof status === 'string' 
      ? (['NotPaid', 'PartiallyPaid', 'FullyPaid'].indexOf(status))
      : status;
      
    switch (statusNum) {
      case 0: // NotPaid
        return <Badge bg="danger" className="payment-badge">
          <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
          <span>Ödenmedi</span>
        </Badge>;
      case 1: // PartiallyPaid
        return <Badge bg="warning" className="payment-badge">
          <FontAwesomeIcon icon={faCreditCard} className="me-1" />
          <span>Kısmen Ödendi</span>
        </Badge>;
      case 2: // FullyPaid
        return <Badge bg="success" className="payment-badge">
          <FontAwesomeIcon icon={faMoneyBill} className="me-1" />
          <span>Tam Ödendi</span>
        </Badge>;
      default:
        return <Badge bg="secondary" className="payment-badge">
          <FontAwesomeIcon icon={faList} className="me-1" />
          <span>Bilinmiyor</span>
        </Badge>;
    }
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Fiyat formatı
  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '0 ₺';
    return `${price.toLocaleString('tr-TR')} ₺`;
  };

  // Saat formatı
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: colors.primary }} />
        <p className="mt-2">Rezervasyonlar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="reservations-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: colors.primary, fontWeight: 'bold' }}>Rezervasyon Yönetimi</h2>
        <Button 
          variant="success" 
          onClick={fetchReservations}
          style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
        >
          <FontAwesomeIcon icon={faSync} className="me-2" />
          Yenile
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex align-items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" size="lg" />
          <div>
            <p className="mb-0">{error}</p>
            <p className="mb-0 mt-1 text-muted small">Demo veriler gösteriliyor.</p>
          </div>
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ color: colors.primary }} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Ad, telefon, hizmet veya adres ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #ced4da' }}
                />
              </InputGroup>
            </Col>
            <Col md={8}>
              <div className="d-flex gap-2 justify-content-end">
                <InputGroup style={{ maxWidth: '240px' }}>
                  <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                    <FontAwesomeIcon 
                      icon={faFilter} 
                      style={{ 
                        color: statusFilter !== null ? colors.primary : '#6c757d' 
                      }} 
                    />
                  </InputGroup.Text>
                  <Form.Select
                    value={statusFilter === null ? '' : statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value === '' ? null : parseInt(e.target.value))}
                    style={{ border: 'none', borderBottom: '1px solid #ced4da' }}
                    className="filter-select"
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="0">Beklemede</option>
                    <option value="1">Onaylandı</option>
                    <option value="2">Reddedildi</option>
                    <option value="3">İptal Edildi</option>
                    <option value="4">Tamamlandı</option>
                  </Form.Select>
                </InputGroup>
                
                <InputGroup style={{ maxWidth: '240px' }}>
                  <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                    <FontAwesomeIcon 
                      icon={faCreditCard} 
                      style={{ 
                        color: paymentStatusFilter !== null ? colors.primary : '#6c757d' 
                      }} 
                    />
                  </InputGroup.Text>
                  <Form.Select
                    value={paymentStatusFilter === null ? '' : paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value === '' ? null : parseInt(e.target.value))}
                    style={{ border: 'none', borderBottom: '1px solid #ced4da' }}
                    className="filter-select"
                  >
                    <option value="">Tüm Ödemeler</option>
                    <option value="0">Ödenmemiş</option>
                    <option value="1">Kısmen Ödenmiş</option>
                    <option value="2">Tam Ödenmiş</option>
                  </Form.Select>
                </InputGroup>
                
                <InputGroup style={{ maxWidth: '200px' }}>
                  <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                    <FontAwesomeIcon 
                      icon={faCalendarAlt} 
                      style={{ 
                        color: dateFilter ? colors.primary : '#6c757d' 
                      }} 
                    />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={{ border: 'none', borderBottom: '1px solid #ced4da' }}
                  />
                </InputGroup>
                
                {(statusFilter !== null || paymentStatusFilter !== null || dateFilter || searchTerm) && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={resetFilters}
                    size="sm"
                    className="d-flex align-items-center"
                    style={{ height: '38px' }}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                    Filtreleri Temizle
                  </Button>
                )}
              </div>
            </Col>
          </Row>
          
          <div className="mt-3 d-flex justify-content-between align-items-center">
            <div>
              <Badge 
                bg={filteredReservations.length > 0 ? "primary" : "secondary"}
                className="py-2 px-3 rounded-pill"
              >
                <FontAwesomeIcon icon={faList} className="me-2" />
                {filteredReservations.length} Rezervasyon Bulundu
              </Badge>
            </div>
            <div className="small text-muted">
              {(statusFilter !== null || paymentStatusFilter !== null || dateFilter || searchTerm) ? 
                'Filtreleme aktif' : 'Tüm rezervasyonlar gösteriliyor'}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="reservation-table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Müşteri</th>
                  <th>Hizmet</th>
                  <th>Tarih / Saat</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Ödeme</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className={
                    reservation.status === 0 ? 'table-warning-subtle' : 
                    reservation.status === 1 ? 'table-primary-subtle' : 
                    reservation.status === 2 ? 'table-dark-subtle' : 
                    reservation.status === 3 ? 'table-danger-subtle' : 
                    reservation.status === 4 ? 'table-success-subtle' : ''
                  }>
                    <td className="text-center">#{reservation.id}</td>
                    <td>
                      <div className="fw-bold">{reservation.userFullName}</div>
                      <div className="small text-muted">{reservation.phone}</div>
                    </td>
                    <td>
                      <div>{reservation.serviceTitle}</div>
                      <div className="small text-muted">{reservation.addressTitle}</div>
                    </td>
                    <td>
                      <div className="fw-bold">{formatDate(reservation.reservationDate)}</div>
                      <div className="small text-muted">{formatTime(reservation.startTime)}</div>
                    </td>
                    <td>
                      <div className="fw-bold">{formatPrice(reservation.finalPrice)}</div>
                      <div className={`small ${reservation.remainingAmount > 0 ? 'text-danger' : 'text-success'}`}>
                        Kalan Ödeme: {formatPrice(reservation.remainingAmount)}
                      </div>
                    </td>
                    <td>{getStatusBadge(reservation.status, reservation.statusText || '')}</td>
                    <td>{getPaymentStatusBadge(reservation.paymentStatus, reservation.paymentStatusText || '')}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => navigate(`/reservations/${reservation.id}`)}
                          className="btn-icon"
                          title="Detayları Görüntüle"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={() => navigate(`/reservations/${reservation.id}/edit`)}
                          className="btn-icon"
                          title="Düzenle"
                        >
                          <FontAwesomeIcon icon={faPencilAlt} />
                        </Button>
                        
                        {/* Ödeme butonu - her zaman göster */}
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="btn-icon"
                          onClick={() => navigate(`/reservations/${reservation.id}?payment=true`)}
                          title="Ödeme Ekle"
                          style={{ backgroundColor: '#e7f7ee', borderColor: '#28a745' }}
                        >
                          <FontAwesomeIcon icon={faDollarSign} style={{ color: '#28a745' }} />
                        </Button>
                        
                        {reservation.status === 1 && ( // Onaylanmış rezervasyonlar
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="btn-icon"
                            disabled={reminderSending[reservation.id]}
                            onClick={() => sendReminderEmail(reservation.id)}
                            title="Hatırlatma Gönder"
                          >
                            <FontAwesomeIcon icon={faEnvelope} />
                          </Button>
                        )}
                        
                        {reservation.status === 4 && ( // Tamamlanmış rezervasyonlar
                          <Button 
                            variant="outline-warning" 
                            size="sm" 
                            className="btn-icon"
                            disabled={ratingSending[reservation.id]}
                            onClick={() => sendRatingReminder(reservation.id)}
                            title="Değerlendirme Hatırlatması Gönder"
                          >
                            <FontAwesomeIcon icon={faStar} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReservations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="text-muted">
                        <FontAwesomeIcon icon={faFilter} className="me-2 fs-4" />
                        <p className="mb-2 mt-2">Filtrelere uygun rezervasyon bulunamadı.</p>
                        {(statusFilter !== null || paymentStatusFilter !== null || dateFilter || searchTerm) && (
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={resetFilters}
                          >
                            Filtreleri Temizle
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ReservationsPage; 