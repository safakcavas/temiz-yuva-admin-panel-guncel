import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Alert, Form, Modal, Tabs, Tab } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
  faExclamationTriangle,
  faCalendarAlt,
  faMoneyBillWave,
  faUser,
  faMapMarkerAlt,
  faStickyNote,
  faEnvelope,
  faStar,
  faArrowLeft,
  faSave,
  faPencilAlt,
  faCreditCard,
  faPlus,
  faHistory,
  faPrint,
  faList
} from '@fortawesome/free-solid-svg-icons';
import './ReservationDetailPage.css';
import { toast } from 'react-hot-toast';

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
  status: number | string;
  statusText?: string;
  paymentStatus: number | string;
  paymentStatusText?: string;
  paymentMethod: number | string;
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

const ReservationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isEditMode = location.includes('/edit');
  const searchParams = new URLSearchParams(window.location.search);
  const shouldOpenPayment = searchParams.get('payment') === 'true';
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [statusFormData, setStatusFormData] = useState({
    reservationDate: '',
    startTime: '',
    endTime: '',
    notes: '',
    price: 0,
    status: 0,
    paymentStatus: 0,
    paymentMethod: 0
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentMethod: 2, // Default: Credit Card
    note: ''
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState<boolean>(false);
  const [reminderSending, setReminderSending] = useState<boolean>(false);
  const [ratingSending, setRatingSending] = useState<boolean>(false);
  
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

  // Kontrolü birleştirelim - remaining amount sıfır olsa bile butonun aktif olmasını sağlayalım
  const hasRemainingAmount = () => {
    if (!reservation) return false;
    
    // Eğer remaining amount tanımlı değilse veya NaN ise, default olarak true dön
    if (reservation.remainingAmount === undefined || 
        reservation.remainingAmount === null ||
        isNaN(Number(reservation.remainingAmount))) {
      console.log('Kalan tutar tanımlı değil, ödeme butonu aktif');
      return true;
    }
    
    // Kalan tutar 0'dan büyükse true dön
    const remaining = Number(reservation.remainingAmount);
    console.log('Kalan tutar:', remaining);
    return remaining > 0;
  };

  useEffect(() => {
    fetchReservationDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (reservation) {
      const statusNum = typeof reservation.status === 'string' 
        ? getStatusNumber(reservation.status)
        : reservation.status;
        
      const paymentStatusNum = typeof reservation.paymentStatus === 'string'
        ? getPaymentStatusNumber(reservation.paymentStatus)
        : reservation.paymentStatus;
        
      const paymentMethodNum = typeof reservation.paymentMethod === 'string'
        ? getPaymentMethodNumber(reservation.paymentMethod)
        : reservation.paymentMethod;
        
      setStatusFormData({
        reservationDate: reservation.reservationDate.split('T')[0],
        startTime: reservation.startTime,
        endTime: reservation.endTime || '',
        notes: reservation.notes || '',
        price: reservation.price,
        status: statusNum,
        paymentStatus: paymentStatusNum,
        paymentMethod: paymentMethodNum
      });
      
      // Ödeme formu verilerini doldur
      setPaymentFormData({
        amount: Number(reservation.remainingAmount) || 0,
        paymentMethod: 2, // Default: Credit Card
        note: `Rezervasyon #${reservation.id} için ödeme`
      });
      
      // Kalan tutar bilgilerini console'a yaz
      console.log('Reservation loaded', {
        remainingAmount: reservation.remainingAmount,
        hasRemainingAmount: hasRemainingAmount()
      });
      
      // Ödeme modalını açmak için URL parametresi kontrolü
      const params = new URLSearchParams(window.location.search);
      const paymentParam = params.get('payment');
      
      // Rezervasyon yüklendiyse ve URL'de payment parametresi varsa modalı aç
      if (paymentParam === 'true' && reservation) {
        console.log('Payment modal should open, remaining amount:', reservation.remainingAmount);
        // Modal açılması için gerekli formu oluştur
        setPaymentFormData({
          amount: Number(reservation.remainingAmount) || 0,
          paymentMethod: 2, // Default: Credit Card
          note: `Rezervasyon #${reservation.id} için ödeme`
        });
        // Modalı aç
        setShowPaymentModal(true);
        
        // URL'den payment parametresini kaldır
        const newUrl = window.location.pathname;
        window.history.pushState({}, '', newUrl);
      }
    }
  }, [reservation]);

  useEffect(() => {
    // Edit modunda ise ve rezervasyon yüklendiyse modalı aç
    if (isEditMode && reservation && !showStatusModal) {
      handleOpenStatusModal();
    }
  }, [isEditMode, reservation, showStatusModal]);

  const fetchReservationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/admin/reservations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('API yanıtı:', response.data);
      
      let reservationData;
      
      // API yanıtı formatını kontrol et
      if (response.data && response.data.isSuccess && response.data.reservation) {
        // Admin API formatı
        reservationData = response.data.reservation;
      } else if (response.data && response.data.id) {
        // Doğrudan rezervasyon objesi
        reservationData = response.data;
      } else {
        throw new Error('Rezervasyon verileri bulunamadı');
      }
      
      // Status ve paymentStatus alanlarını normalize et
      let statusNumber = 0;
      let statusText = '';
      
      if (typeof reservationData.status === 'string') {
        statusText = reservationData.status;
        statusNumber = getStatusNumber(reservationData.status);
      } else if (typeof reservationData.status === 'number') {
        statusNumber = reservationData.status;
        statusText = reservationData.statusText || getStatusString(reservationData.status);
      }
      
      let paymentStatusNumber = 0;
      let paymentStatusText = '';
      
      if (typeof reservationData.paymentStatus === 'string') {
        paymentStatusText = reservationData.paymentStatus;
        paymentStatusNumber = getPaymentStatusNumber(reservationData.paymentStatus);
      } else if (typeof reservationData.paymentStatus === 'number') {
        paymentStatusNumber = reservationData.paymentStatus;
        paymentStatusText = reservationData.paymentStatusText || getPaymentStatusString(reservationData.paymentStatus);
      }
      
      // Normalize edilmiş rezervasyon verisini ayarla
      const normalizedReservation = {
        ...reservationData,
        status: statusNumber,
        statusText: statusText,
        paymentStatus: paymentStatusNumber,
        paymentStatusText: paymentStatusText
      };
      
      setReservation(normalizedReservation);
      
    } catch (err) {
      console.error('Rezervasyon detayları alınamadı:', err);
      setError('Rezervasyon detayları yüklenirken bir hata oluştu.');
      
      // Demo veri ile devam et
    } finally {
      setLoading(false);
    }
  };

  const getStatusNumber = (status: string): number => {
    const statusMap: { [key: string]: number } = {
      'Pending': 0,
      'Approved': 1,
      'Rejected': 2,
      'Canceled': 3,
      'Completed': 4
    };
    return statusMap[status] !== undefined ? statusMap[status] : 0;
  };

  const getStatusString = (status: number): string => {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Approved',
      2: 'Rejected',
      3: 'Canceled',
      4: 'Completed'
    };
    return statusMap[status] !== undefined ? statusMap[status] : 'Pending';
  };

  const getPaymentStatusNumber = (status: string): number => {
    const statusMap: { [key: string]: number } = {
      'NotPaid': 0,
      'PartiallyPaid': 1,
      'FullyPaid': 2
    };
    return statusMap[status] !== undefined ? statusMap[status] : 0;
  };
  
  const getPaymentStatusString = (status: number): string => {
    const statusMap: { [key: number]: string } = {
      0: 'NotPaid',
      1: 'PartiallyPaid',
      2: 'FullyPaid'
    };
    return statusMap[status] !== undefined ? statusMap[status] : 'NotPaid';
  };
  
  const getPaymentMethodNumber = (method: string): number => {
    const methodMap: { [key: string]: number } = {
      'None': 0,
      'Online': 1,
      'CreditCard': 2,
      'Cash': 3,
      'BankTransfer': 4
    };
    return methodMap[method] !== undefined ? methodMap[method] : 0;
  };
  
  const getPaymentMethodString = (method: number): string => {
    const methodMap: { [key: number]: string } = {
      0: 'None',
      1: 'Online',
      2: 'CreditCard',
      3: 'Cash',
      4: 'BankTransfer'
    };
    return methodMap[method] !== undefined ? methodMap[method] : 'None';
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStatusFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : 
              name === 'status' ? parseInt(value) :
              name === 'paymentStatus' ? parseInt(value) :
              name === 'paymentMethod' ? parseInt(value) : value
    }));
  };

  const handleOpenStatusModal = () => {
    setShowStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    // Eğer edit modunda ise ve modal kapatılıyorsa, detay sayfasına geri dön
    if (isEditMode) {
      navigate(`/reservations/${id}`);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      
      // API'ye gönderilecek veriyi formatla
      const updateData = {
        reservationDate: statusFormData.reservationDate,
        startTime: statusFormData.startTime,
        endTime: statusFormData.endTime || statusFormData.startTime, // API için endTime gerekli
        notes: statusFormData.notes,
        price: statusFormData.price,
        status: statusFormData.status
      };
      
      console.log('Gönderilen veri:', updateData);
      
      const response = await axios.put(
        `${API_BASE_URL}/admin/reservations/${id}`, 
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('API yanıtı:', response.data);
      
      // Başarılı ise rezervasyon bilgilerini güncelle
      const statusString = getStatusString(statusFormData.status);
      
      setReservation(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          reservationDate: statusFormData.reservationDate,
          startTime: statusFormData.startTime,
          endTime: statusFormData.endTime,
          notes: statusFormData.notes,
          price: statusFormData.price,
          status: statusFormData.status,
          statusText: statusString
        };
      });
      
      setSubmitting(false);
      handleCloseStatusModal();
      
      // Başarılı mesajı göster
      alert('Rezervasyon başarıyla güncellendi!');
      
      // Başarılı güncelleme sonrası sayfayı yenile
      fetchReservationDetails();
    } catch (err) {
      console.error('Durum güncellenirken hata oluştu:', err);
      alert('Durum güncellenirken bir hata oluştu.');
      setSubmitting(false);
    }
  };

  // Ödeme modalını açmak için URL parametresi kontrolü
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentParam = params.get('payment');
    
    // Rezervasyon yüklendiyse ve URL'de payment parametresi varsa modalı aç
    if (paymentParam === 'true' && reservation) {
      console.log('Payment modal should open, remaining amount:', reservation.remainingAmount);
      // Modal açılması için gerekli formu oluştur
      setPaymentFormData({
        amount: Number(reservation.remainingAmount) || 0,
        paymentMethod: 2, // Default: Credit Card
        note: `Rezervasyon #${reservation.id} için ödeme`
      });
      // Modalı aç
      setShowPaymentModal(true);
      
      // URL'den payment parametresini kaldır
      const newUrl = window.location.pathname;
      window.history.pushState({}, '', newUrl);
    }
  }, [reservation]);

  // Ödeme ekle butonunu active tutmak için
  const handleOpenPaymentModal = () => {
    console.log('Opening payment modal, remaining amount:', reservation?.remainingAmount);
    if (reservation) {
      setPaymentFormData({
        amount: Number(reservation.remainingAmount) || 0,
        paymentMethod: 2, // Default: Credit Card
        note: `Rezervasyon #${reservation.id} için ödeme`
      });
      setShowPaymentModal(true);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : 
              name === 'paymentMethod' ? parseInt(value) : value
    }));
  };

  const handleAddPayment = async () => {
    try {
      // Giriş doğrulama kontrolleri
      if (!id) {
        alert('Rezervasyon ID bulunamadı!');
        return;
      }

      if (paymentFormData.amount <= 0) {
        alert('Ödeme tutarı sıfırdan büyük olmalıdır!');
        return;
      }

      if (reservation && paymentFormData.amount > reservation.remainingAmount) {
        alert(`Ödeme tutarı kalan tutardan (${formatPrice(reservation.remainingAmount)}) fazla olamaz!`);
        return;
      }

      setPaymentSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı! Lütfen tekrar giriş yapın.');
      }
      
      // Farklı API formatlarını sırayla deneyeceğiz
      const errors = [];
      
      // Alternatif 1: /Reservations/{id}/payments endpoint'i
      try {
        const paymentData1 = {
          amount: paymentFormData.amount,
          methodId: paymentFormData.paymentMethod,
          note: paymentFormData.note || ''
        };
        
        console.log('Alternatif 1 - Gönderilen veri:', paymentData1);
        
        const response = await axios.post(
          `${API_BASE_URL}/Reservations/${id}/payments`, 
          paymentData1,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('API yanıtı (Alternatif 1):', response.data);
        
        // Başarılı mesajı göster
        alert('Ödeme başarıyla eklendi!');
        
        setPaymentSubmitting(false);
        handleClosePaymentModal();
        
        // Başarılı ekleme sonrası sayfayı yenile
        fetchReservationDetails();
        return;
      } catch (error) {
        console.error('Alternatif 1 başarısız:', error);
        errors.push({
          endpoint: `/Reservations/${id}/payments`,
          error
        });
        // Alternatif 2'yi denemeye devam et
      }
      
      // Alternatif 2: /Payments endpoint'i
      try {
        const paymentData2 = {
          reservationId: parseInt(id),
          amount: paymentFormData.amount,
          paymentMethod: paymentFormData.paymentMethod,
          note: paymentFormData.note || ''
        };
        
        console.log('Alternatif 2 - Gönderilen veri:', paymentData2);
        
        const response = await axios.post(
          `${API_BASE_URL}/Payments`, 
          paymentData2,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('API yanıtı (Alternatif 2):', response.data);
        
        // Başarılı mesajı göster
        alert('Ödeme başarıyla eklendi!');
        
        setPaymentSubmitting(false);
        handleClosePaymentModal();
        
        // Başarılı ekleme sonrası sayfayı yenile
        fetchReservationDetails();
        return;
      } catch (error) {
        console.error('Alternatif 2 başarısız:', error);
        errors.push({
          endpoint: '/Payments',
          error
        });
        // Alternatif 3'ü denemeye devam et
      }
      
      // Alternatif 3: /admin/reservations/{id}/payment endpoint'i
      try {
        const paymentData3 = {
          amount: paymentFormData.amount,
          paymentMethod: paymentFormData.paymentMethod,
          note: paymentFormData.note || ''
        };
        
        console.log('Alternatif 3 - Gönderilen veri:', paymentData3);
        
        const response = await axios.post(
          `${API_BASE_URL}/admin/reservations/${id}/payment`, 
          paymentData3,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('API yanıtı (Alternatif 3):', response.data);
        
        // Başarılı mesajı göster
        alert('Ödeme başarıyla eklendi!');
        
        setPaymentSubmitting(false);
        handleClosePaymentModal();
        
        // Başarılı ekleme sonrası sayfayı yenile
        fetchReservationDetails();
        return;
      } catch (error) {
        console.error('Alternatif 3 başarısız:', error);
        errors.push({
          endpoint: `/admin/reservations/${id}/payment`,
          error
        });
        
        // Tüm alternatifler başarısız olduğunda daha detaylı bir hata mesajı göster
        console.error('Tüm API alternatifleri başarısız oldu:', errors);
        
        // En son hatayı kullan
        throw error;
      }
      
    } catch (err) {
      console.error('Ödeme eklenirken hata oluştu:', err);
      
      // API hata yanıtını daha detaylı göster
      if (axios.isAxiosError(err) && err.response) {
        console.error('API Hata Yanıtı:', err.response.data);
        console.error('Durum Kodu:', err.response.status);
        
        let errorMessage = 'Ödeme eklenirken bir hata oluştu: ';
        if (err.response.data && typeof err.response.data === 'object') {
          if (err.response.data.message) {
            errorMessage += err.response.data.message;
          } else if (err.response.data.title) {
            errorMessage += err.response.data.title;
          } else if (err.response.data.error) {
            errorMessage += err.response.data.error;
          }
        } else if (err.response.statusText) {
          errorMessage += `(${err.response.status}) ${err.response.statusText}`;
        } else {
          errorMessage += (err.message || 'Bilinmeyen hata');
        }
        
        alert(errorMessage);
      } else {
        alert('Ödeme eklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
      }
      
      setPaymentSubmitting(false);
    }
  };

  // Durum badge'i
  const getStatusBadge = (status: number | string) => {
    // Status string ise number'a çevir
    const statusNum = typeof status === 'string' 
      ? getStatusNumber(status)
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
          <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
          <span>Bilinmiyor</span>
        </Badge>;
    }
  };

  // Fiyat formatı
  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '0 ₺';
    return `${price.toLocaleString('tr-TR')} ₺`;
  };

  // Tarih formatı
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Saat formatı
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  // Değerlendirme hatırlatması gönderme
  const sendRatingReminder = async () => {
    try {
      setRatingSending(true);
      const token = localStorage.getItem('token');
      
      // Doğru endpoint: /admin/reservations/{id}/send-rating-reminder
      console.log(`Değerlendirme hatırlatması gönderiliyor. ID: ${id}`);
      
      await axios.post(`${API_BASE_URL}/ratings/send-email/${id}`, null, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success('Değerlendirme hatırlatma e-postası başarıyla gönderildi!');
    } catch (error) {
      console.error('Değerlendirme hatırlatma e-postası gönderilemedi:', error);
      toast.error('Değerlendirme hatırlatma e-postası gönderilirken bir hata oluştu.');
    } finally {
      setRatingSending(false);
    }
  };
  
  // Hatırlatma e-postası gönderme
  const sendReminderEmail = async () => {
    try {
      setReminderSending(true);
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/admin/reservations/${id}/send-reminder`, null, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success('Hatırlatma e-postası başarıyla gönderildi!');
    } catch (error) {
      console.error('Hatırlatma e-postası gönderilemedi:', error);
      toast.error('Hatırlatma e-postası gönderilirken bir hata oluştu.');
    } finally {
      setReminderSending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Rezervasyon detayları yükleniyor...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <Alert variant="danger">
        Rezervasyon bulunamadı veya bir hata oluştu.
      </Alert>
    );
  }

  return (
    <div className="reservation-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <FontAwesomeIcon icon={faCalendarAlt} className="me-2" style={{ color: colors.primary }} />
          Rezervasyon #{reservation.id}
        </h1>
        <div>
          {!isEditMode && (
            <>
              <Button 
                variant="primary" 
                className="me-2"
                onClick={handleOpenStatusModal}
              >
                <FontAwesomeIcon icon={faPencilAlt} className="me-1" />
                Durum Güncelle
              </Button>
              <Button 
                variant="success" 
                className="me-2"
                onClick={handleOpenPaymentModal}
              >
                <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                Ödeme Ekle
              </Button>
            </>
          )}
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/reservations')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
            Geri Dön
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          {error}
          <p className="mb-0 mt-2">Demo veriler gösteriliyor.</p>
        </Alert>
      )}

      <Row>
        <Col md={8}>
          <Card className="reservation-card mb-4 shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" style={{ color: colors.primary }} />
                  Rezervasyon Özeti
                </h5>
                <div>{getStatusBadge(reservation.statusText || '')}</div>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={3} className="border-end">
                  <div className="text-center mb-2">
                    <div className="text-muted small">Tarih</div>
                    <div className="fs-5 fw-bold">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                      {formatDate(reservation.reservationDate)}
                    </div>
                  </div>
                </Col>
                <Col md={3} className="border-end">
                  <div className="text-center mb-2">
                    <div className="text-muted small">Saat</div>
                    <div className="fs-5 fw-bold">
                      {formatTime(reservation.startTime)}
                    </div>
                  </div>
                </Col>
                <Col md={3} className="border-end">
                  <div className="text-center mb-2">
                    <div className="text-muted small">Hizmet</div>
                    <div className="fs-5 fw-bold">{reservation.serviceTitle}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center mb-2">
                    <div className="text-muted small">Platform</div>
                    <div className="fs-5 fw-bold">
                      {reservation.platform || "Web"}
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="mt-1">
                <Tabs defaultActiveKey="details" className="mb-3">
                  <Tab eventKey="details" title={<span><FontAwesomeIcon icon={faInfoCircle} className="me-2" />Detaylar</span>}>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <h6 className="text-muted fw-bold">Müşteri Bilgileri</h6>
                          <div className="p-3 bg-light rounded">
                            <div className="mb-2">
                              <strong>Ad Soyad:</strong> {reservation.userFullName}
                            </div>
                            <div className="mb-2">
                              <strong>E-posta:</strong> {reservation.email}
                            </div>
                            <div>
                              <strong>Telefon:</strong> {reservation.phone}
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <h6 className="text-muted fw-bold">Adres Bilgileri</h6>
                          <div className="p-3 bg-light rounded">
                            <div className="mb-2">
                              <strong>Adres Başlığı:</strong> {reservation.addressTitle}
                            </div>
                            <div>
                              <strong>Adres:</strong> {reservation.addressFullAddress}
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    <div className="mt-2">
                      <h6 className="text-muted fw-bold">Notlar</h6>
                      <div className="p-3 bg-light rounded">
                        {reservation.notes || 'Not bulunmuyor.'}
                      </div>
                    </div>
                    
                    {(reservation.cancellationReason || reservation.rejectionReason) && (
                      <div className="mt-3">
                        <h6 className="text-muted fw-bold">Diğer Bilgiler</h6>
                        <div className="p-3 bg-light rounded">
                          {reservation.cancellationReason && (
                            <div className="mb-2">
                              <strong>İptal Sebebi:</strong> {reservation.cancellationReason}
                            </div>
                          )}
                          {reservation.rejectionReason && (
                            <div>
                              <strong>Reddetme Sebebi:</strong> {reservation.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Tab>
                  
                  <Tab eventKey="history" title={<span><FontAwesomeIcon icon={faHistory} className="me-2" />Durum Geçmişi</span>}>
                    <div className="text-center text-muted my-4">
                      <p>Durum geçmişi yakında eklenecek</p>
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* Ödeme Kartı */}
          <Card className="mb-4 shadow-sm border-0 payment-summary-card">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold">
                <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" style={{ color: colors.primary }} />
                Ödeme Bilgileri
              </h5>
            </Card.Header>
            <Card.Body className="payment-card-body">
              <div className="price-container p-3 mb-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Toplam Tutar:</span>
                  <span className="fs-4 fw-bold">{formatPrice(reservation.finalPrice)}</span>
                </div>
                
                <div className="payment-progress mb-2">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Ödenen</span>
                    <span className="text-muted small">
                      {formatPrice(reservation.paidTotal)} / {formatPrice(reservation.finalPrice)}
                    </span>
                  </div>
                  
                  <div className="progress" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{ 
                        width: `${reservation.finalPrice > 0 
                          ? (reservation.paidTotal / reservation.finalPrice) * 100 
                          : 0}%` 
                      }}
                      aria-valuenow={reservation.paidTotal} 
                      aria-valuemin={0} 
                      aria-valuemax={reservation.finalPrice}>
                    </div>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Kalan Tutar:</span>
                  <span className={`fw-bold ${reservation.remainingAmount > 0 ? 'text-danger' : 'text-success'}`}>
                    {formatPrice(reservation.remainingAmount)}
                  </span>
                </div>
              </div>
              
              <div className="payment-details">
                <div className="mb-2 d-flex justify-content-between">
                  <span>Ödeme Durumu:</span>
                  <Badge bg={
                    reservation.paymentStatus === 0 || reservation.paymentStatusText === 'NotPaid' ? 'danger' :
                    reservation.paymentStatus === 1 || reservation.paymentStatusText === 'PartiallyPaid' ? 'warning' :
                    reservation.paymentStatus === 2 || reservation.paymentStatusText === 'FullyPaid' ? 'success' : 'secondary'
                  }>
                    {reservation.paymentStatusText === 'NotPaid' ? 'Ödenmedi' :
                     reservation.paymentStatusText === 'PartiallyPaid' ? 'Kısmen Ödendi' :
                     reservation.paymentStatusText === 'FullyPaid' ? 'Tam Ödendi' : 
                     reservation.paymentStatusText}
                  </Badge>
                </div>
                
                <div className="mb-2 d-flex justify-content-between">
                  <span>Ödeme Yöntemi:</span>
                  <Badge bg="info">
                    {reservation.paymentMethodText === 'None' ? 'Belirtilmemiş' :
                     reservation.paymentMethodText === 'CreditCard' ? 'Kredi Kartı' :
                     reservation.paymentMethodText === 'Cash' ? 'Nakit' :
                     reservation.paymentMethodText === 'BankTransfer' ? 'Banka Transferi' :
                     reservation.paymentMethodText}
                  </Badge>
                </div>
                
                {reservation.paymentDate && (
                  <div className="mb-2 d-flex justify-content-between">
                    <span>Son Ödeme Tarihi:</span>
                    <span>{formatDate(reservation.paymentDate)}</span>
                  </div>
                )}
                
                {reservation.callCenterPaymentAmount !== undefined && reservation.callCenterPaymentAmount > 0 && (
                  <div className="mb-2 d-flex justify-content-between">
                    <span>Çağrı Merkezi Ödemesi:</span>
                    <span>{formatPrice(reservation.callCenterPaymentAmount)}</span>
                  </div>
                )}
                
                {reservation.paymentNote && (
                  <div className="mt-3 p-2 bg-light rounded">
                    <small className="text-muted mb-1 d-block">Ödeme Notu:</small>
                    <div>{reservation.paymentNote}</div>
                  </div>
                )}
              </div>
              
              <div className="mt-3">
                <Button 
                  variant="success" 
                  className="w-100"
                  onClick={handleOpenPaymentModal}
                >
                  <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                  {reservation.remainingAmount > 0 ? 'Ödeme Ekle' : 'Yeni Ödeme Ekle'}
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          {/* İşlemler Kartı */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold">
                <FontAwesomeIcon icon={faList} className="me-2" style={{ color: colors.primary }} />
                İşlemler
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary" 
                  onClick={handleOpenStatusModal}
                >
                  <FontAwesomeIcon icon={faPencilAlt} className="me-2" />
                  Rezervasyon Durumunu Güncelle
                </Button>
                
                {reservation.status === 1 && ( // Onaylanmış rezervasyonlar
                  <Button 
                    variant="outline-info" 
                    disabled={reminderSending}
                    onClick={sendReminderEmail}
                  >
                    <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                    Müşteriye Hatırlatma Gönder
                  </Button>
                )}
                
                {reservation.status === 4 && ( // Tamamlanmış rezervasyonlar
                  <Button 
                    variant="outline-warning" 
                    disabled={ratingSending}
                    onClick={sendRatingReminder}
                  >
                    <FontAwesomeIcon icon={faStar} className="me-2" />
                    Değerlendirme Hatırlatması Gönder
                  </Button>
                )}
                
                <Button 
                  variant="outline-secondary" 
                  onClick={() => window.print()}
                >
                  <FontAwesomeIcon icon={faPrint} className="me-2" />
                  Yazdır
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Durum Güncelleme Modal */}
      <Modal show={showStatusModal} onHide={handleCloseStatusModal} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: colors.light }}>
          <Modal.Title>
            <FontAwesomeIcon icon={faPencilAlt} className="me-2" style={{ color: colors.primary }} />
            Rezervasyon Bilgilerini Güncelle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            Rezervasyon #{id} bilgilerini güncelleyebilirsiniz. Tüm alanları doğru şekilde doldurduğunuzdan emin olun.
          </Alert>

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rezervasyon Tarihi</Form.Label>
                  <Form.Control
                    type="date"
                    name="reservationDate"
                    value={statusFormData.reservationDate}
                    onChange={handleStatusChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlangıç Saati</Form.Label>
                  <Form.Control
                    type="time"
                    name="startTime"
                    value={statusFormData.startTime.substring(0, 5)}
                    onChange={handleStatusChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bitiş Saati</Form.Label>
                  <Form.Control
                    type="time"
                    name="endTime"
                    value={statusFormData.endTime ? statusFormData.endTime.substring(0, 5) : ''}
                    onChange={handleStatusChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fiyat (₺)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={statusFormData.price}
                    onChange={handleStatusChange}
                    min={0}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Durum</Form.Label>
              <Form.Select 
                name="status"
                value={statusFormData.status}
                onChange={handleStatusChange}
              >
                <option value={0}>Beklemede</option>
                <option value={1}>Onaylandı</option>
                <option value={2}>Reddedildi</option>
                <option value={3}>İptal Edildi</option>
                <option value={4}>Tamamlandı</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Rezervasyonun mevcut durumunu seçin. Mevcut durum: {reservation ? getStatusBadge(reservation.status) : ''}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notlar</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={statusFormData.notes}
                onChange={handleStatusChange}
                placeholder="Müşteriye iletilecek notunuzu yazın"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: colors.light }}>
          <Button variant="secondary" onClick={handleCloseStatusModal}>
            <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateStatus}
            disabled={submitting}
            style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
          >
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Güncelleniyor...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="me-1" />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Ödeme Ekleme Modal */}
      <Modal show={showPaymentModal} onHide={handleClosePaymentModal} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.light }}>
          <Modal.Title>
            <FontAwesomeIcon icon={faCreditCard} className="me-2" style={{ color: colors.primary }} />
            Ödeme Ekle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            Rezervasyon için yeni bir ödeme ekleyin. Kalan tutar: {reservation ? formatPrice(reservation.remainingAmount) : '0 ₺'}
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ödeme Tutarı (₺)</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                value={paymentFormData.amount}
                onChange={handlePaymentChange}
                min={0}
                max={reservation ? reservation.remainingAmount : 0}
              />
              <Form.Text className="text-muted">
                Eklenecek ödeme tutarını girin. Maksimum: {reservation ? formatPrice(reservation.remainingAmount) : '0 ₺'}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ödeme Yöntemi</Form.Label>
              <Form.Select 
                name="paymentMethod"
                value={paymentFormData.paymentMethod}
                onChange={handlePaymentChange}
              >
                <option value={1}>Online</option>
                <option value={2}>Kredi Kartı</option>
                <option value={3}>Nakit</option>
                <option value={4}>Banka Transferi</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Not</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="note"
                value={paymentFormData.note}
                onChange={handlePaymentChange}
                placeholder="Ödeme hakkında not ekleyin"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: colors.light }}>
          <Button variant="secondary" onClick={handleClosePaymentModal}>
            <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
            İptal
          </Button>
          <Button 
            variant="success" 
            onClick={handleAddPayment}
            disabled={paymentSubmitting || paymentFormData.amount <= 0 || (reservation && paymentFormData.amount > reservation.remainingAmount)}
          >
            {paymentSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Ödeme Ekleniyor...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Ödeme Ekle
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReservationDetailPage; 