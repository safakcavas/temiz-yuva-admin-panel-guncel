import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Spinner, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faArrowLeft, 
  faImage, 
  faInfoCircle, 
  faExclamationTriangle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

interface ServiceFormData {
  title: string;
  imageUrl: string;
  shortDescription: string;
  description: string;
  price: number;
  isActive: boolean;
}
 
const ServiceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    imageUrl: '',
    shortDescription: '',
    description: '',
    price: 0,
    isActive: true
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Yeşil renk paleti
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
    if (isEditMode) {
      fetchServiceDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }
      
      // Doğru endpoint'i kullan
      const endpoint = `${API_BASE_URL}/admin/services/${id}`;
      console.log(`Servis detayları alınıyor: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("API yanıtı:", response.data);
      
      if (response.data) {
        // API yanıtı doğrudan servisi döndürebilir veya içinde service property'si olabilir
        const serviceData = response.data.service || response.data;
        setFormData({
          title: serviceData.title || '',
          imageUrl: serviceData.imageUrl || '',
          shortDescription: serviceData.shortDescription || '',
          description: serviceData.description || '',
          price: serviceData.price || 0,
          isActive: serviceData.isActive !== undefined ? serviceData.isActive : true
        });
      } else {
        setError('API yanıtı boş veya geçersiz.');
      }
    } catch (error) {
      console.error('Hizmet bilgileri yüklenirken hata oluştu:', error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || '';
        const message = error.response?.data?.message || error.message;
        setError(`Hizmet bilgileri yüklenirken bir hata oluştu (${status}): ${message}`);
      } else {
        setError('Hizmet bilgileri yüklenirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : (name === 'price' 
            ? parseFloat(value) || 0
            : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      const data = { ...formData };
      
      console.log("Gönderilen veri:", data);
      
      if (isEditMode) {
        // Düzenleme modu - PUT isteği
        await axios.put(`${API_BASE_URL}/admin/services/${id}`, data, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Ekleme modu - POST isteği
        await axios.post(`${API_BASE_URL}/admin/services`, data, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      setSuccess(true);
      
      // 2 saniye bekleyip hizmetler sayfasına yönlendir
      setTimeout(() => {
        navigate('/services');
      }, 2000);
    } catch (error) {
      console.error('Hizmet kaydedilirken hata oluştu:', error);
      setError('Hizmet kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: colors.primary }} />
        <p className="mt-2">Hizmet bilgileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Button
            variant="link"
            onClick={() => navigate('/services')}
            className="p-0 me-3"
            style={{ color: colors.primary }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size="lg" />
          </Button>
          <h2 style={{ color: colors.primary, fontWeight: 'bold', margin: 0 }}>
            {isEditMode ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle'}
          </h2>
        </div>
      </div>
      
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success">
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Hizmet başarıyla {isEditMode ? 'güncellendi' : 'eklendi'}! Yönlendiriliyorsunuz...
            </Alert>
          )}
          
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-4">
                  <Form.Label>Hizmet Adı <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Hizmet adı girin"
                    required
                    className="shadow-sm"
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Resim URL'si</Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                      <FontAwesomeIcon icon={faImage} style={{ color: colors.primary }} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="border-start-0"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Hizmetin resmi için URL girin
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Kısa Açıklama <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    placeholder="Kısa açıklama girin (liste sayfasında gösterilir)"
                    required
                    maxLength={150}
                    className="shadow-sm"
                  />
                  <div className="d-flex justify-content-between mt-1">
                    <Form.Text className="text-muted">
                      Hizmet listesinde görünecek kısa açıklama
                    </Form.Text>
                    <span className={formData.shortDescription.length > 130 ? 'text-danger' : 'text-muted'}>
                      {formData.shortDescription.length}/150
                    </span>
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Detaylı Açıklama <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Hizmetin detaylı açıklamasını girin"
                    required
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white border-0 pt-3 pb-0">
                    <h5 className="mb-0">Hizmet Ayarları</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-4">
                      <Form.Label>Fiyat (₺) <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price.toString()}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        required
                        className="shadow-sm"
                      />
                      <Form.Text className="text-muted">
                        0 = Ücretsiz hizmet
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Durum</Form.Label>
                      <Form.Check 
                        type="switch"
                        id="isActive"
                        name="isActive"
                        label={formData.isActive ? "Aktif" : "Pasif"}
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="mt-2"
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
                
                {formData.imageUrl && (
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-white border-0 pt-3 pb-0">
                      <h5 className="mb-0">Resim Önizleme</h5>
                    </Card.Header>
                    <Card.Body className="text-center">
                      <img 
                        src={formData.imageUrl} 
                        alt="Önizleme" 
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain'
                        }} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Resim+Yüklenemedi';
                        }}
                      />
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
            
            <hr className="my-4" />
            
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/services')}
              >
                İptal
              </Button>
              
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={submitLoading}
                style={{ 
                  backgroundColor: colors.primary, 
                  borderColor: colors.primary
                }}
              >
                {submitLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {isEditMode ? 'Güncelle' : 'Kaydet'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ServiceFormPage; 