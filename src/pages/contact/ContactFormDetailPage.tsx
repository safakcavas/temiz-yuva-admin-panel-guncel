import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ContactForm } from '../../types/ContactForm';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faEnvelopeOpen, 
  faArrowLeft, 
  faUser, 
  faPhone, 
  faAt, 
  faCalendarAlt, 
  faCheckCircle,
  faCommentAlt,
  faInfoCircle,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import './ContactFormDetailPage.css';

const ContactFormDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState<ContactForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    fetchContactFormDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchContactFormDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_BASE_URL}/contactform/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API Yanıtı:', response.data);

      if (response.data.success) {
        setContactForm(response.data.data);
      } else {
        setError(response.data.message || 'Veriler alınamadı');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'İletişim formu detayı yüklenirken bir hata oluştu');
      console.error('Error fetching contact form detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      setMarkingAsRead(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(`${API_BASE_URL}/contactform/${id}/mark-as-read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Okundu işaretleme yanıtı:', response.data);

      if (response.data.success) {
        fetchContactFormDetail();
      } else {
        setError(response.data.message || 'İşlem başarısız');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Okundu olarak işaretlenirken bir hata oluştu');
      console.error('Error marking as read:', error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: tr });
  };

  const getStatusBadge = (isRead: boolean) => {
    return isRead ? (
      <Badge bg="success" className="status-badge">
        <FontAwesomeIcon icon={faEnvelopeOpen} className="me-1" />
        <span>Okundu</span>
      </Badge>
    ) : (
      <Badge bg="warning" className="status-badge">
        <FontAwesomeIcon icon={faEnvelope} className="me-1" />
        <span>Okunmadı</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">İletişim formu yükleniyor...</p>
      </div>
    );
  }

  if (error || !contactForm) {
    return (
      <Alert variant="danger" className="mt-3">
        {error || 'İletişim formu bulunamadı'}
      </Alert>
    );
  }

  return (
    <div className="contact-form-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">
          <FontAwesomeIcon icon={faEnvelope} className="me-2" />
          İletişim Formu #{id}
        </h2>
        <div>
          {!contactForm.isRead && (
            <Button 
              variant="success"
              className="me-2"
              onClick={markAsRead}
              disabled={markingAsRead}
            >
              {markingAsRead ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  İşaretleniyor...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Okundu Olarak İşaretle
                </>
              )}
            </Button>
          )}
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/contact-forms')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Geri Dön
          </Button>
        </div>
      </div>

      <div className="status-section mb-4">
        {getStatusBadge(contactForm.isRead)}
        <span className="ms-3 text-muted">
          <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
          {formatDateTime(contactForm.createdAt)}
        </span>
      </div>

      <Row>
        <Col md={4}>
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                Gönderen Bilgileri
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="contact-info-item mb-3">
                <div className="contact-info-label">
                  <FontAwesomeIcon icon={faUser} className="me-2 text-muted" />
                  Ad Soyad
                </div>
                <div className="contact-info-value">{contactForm.fullName}</div>
              </div>
              
              <div className="contact-info-item mb-3">
                <div className="contact-info-label">
                  <FontAwesomeIcon icon={faAt} className="me-2 text-muted" />
                  E-posta
                </div>
                <div className="contact-info-value">
                  <a href={`mailto:${contactForm.email}`} className="text-decoration-none">
                    {contactForm.email}
                  </a>
                </div>
              </div>
              
              <div className="contact-info-item">
                <div className="contact-info-label">
                  <FontAwesomeIcon icon={faPhone} className="me-2 text-muted" />
                  Telefon
                </div>
                <div className="contact-info-value">
                  <a href={`tel:${contactForm.phone}`} className="text-decoration-none">
                    {contactForm.phone}
                  </a>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="timeline-card mb-4 shadow-sm border-0">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                Zaman Bilgileri
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-icon bg-primary">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-date">{formatDateTime(contactForm.createdAt)}</div>
                    <div className="timeline-title">Form Gönderildi</div>
                  </div>
                </div>
                
                {contactForm.isRead && contactForm.readAt && (
                  <div className="timeline-item">
                    <div className="timeline-icon bg-success">
                      <FontAwesomeIcon icon={faEnvelopeOpen} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-date">{formatDateTime(contactForm.readAt)}</div>
                      <div className="timeline-title">Okundu</div>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="message-card shadow-sm border-0">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faCommentAlt} className="me-2 text-primary" />
                Mesaj İçeriği
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="subject mb-3">
                <h6 className="text-muted mb-1">Konu</h6>
                <div className="subject-value fw-bold">{contactForm.subject}</div>
              </div>
              
              <div className="message">
                <h6 className="text-muted mb-2">Mesaj</h6>
                <div className="message-content p-3 rounded bg-light">
                  {contactForm.message}
                </div>
              </div>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-end mt-4">
            <Button 
              variant="outline-primary" 
              className="me-2" 
              onClick={() => window.print()}
            >
              <FontAwesomeIcon icon={faPrint} className="me-2" />
              Yazdır
            </Button>
            
            <Button 
              variant="outline-info" 
              href={`mailto:${contactForm.email}?subject=Re: ${contactForm.subject}`}
            >
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />
              E-posta Gönder
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ContactFormDetailPage; 