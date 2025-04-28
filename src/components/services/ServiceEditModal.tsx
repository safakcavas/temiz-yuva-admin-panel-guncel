import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, InputGroup, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { API_BASE_URL } from '../../config/api';

// Window tipini genişlet
declare global {
  interface Window {
    _debugApiUrl?: string;
    _debugToken?: string;
  }
}

interface ServiceEditModalProps {
  show: boolean;
  onHide: () => void;
  serviceId: number | null;
  onSuccess: () => void;
}

interface ServiceFormData {
  title: string;
  imageUrl: string;
  shortDescription: string;
  description: string;
  price: number;
  isActive?: boolean;
}

const ServiceEditModal: React.FC<ServiceEditModalProps> = ({ 
  show, 
  onHide, 
  serviceId, 
  onSuccess 
}) => {
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
    if (show && serviceId) {
      fetchServiceDetails();
      
      // Debug bilgisi konsola
      console.log(`=== HİZMET DÜZENLEME MODAL ===`);
      console.log(`Hizmet ID: ${serviceId}`);
      console.log(`API URL: ${API_BASE_URL}`);
      console.log(`Debug yardımı: Konsolda şunları deneyebilirsiniz:`);
      console.log(`window._debugApiUrl = "https://api-endpoint-adresiniz";`);
      console.log(`window._debugToken = "token-değeriniz";`);
      console.log(`===========================`);
    }
    
    // Modal açıldığında success durumunu sıfırla
    setSuccess(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, serviceId]);

  const fetchServiceDetails = async () => {
    if (!serviceId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // API URL'sini ve token'ı alıyoruz
      let token = localStorage.getItem('token') || '';
      let apiBaseUrl = API_BASE_URL;
      
      // Tarayıcının konsol'una özel debug komutları için destek
      if (window._debugApiUrl) {
        apiBaseUrl = window._debugApiUrl;
        console.log("Debug API URL kullanılıyor:", apiBaseUrl);
      }
      
      if (window._debugToken) {
        token = window._debugToken;
        console.log("Debug Token kullanılıyor");
      }
      
      // Doğru API endpoint'ini kullanıyoruz
      const endpoint = `${apiBaseUrl}/api/admin/services/${serviceId}`;
      console.log(`API isteği yapılıyor: ${endpoint}`);
      
      try {
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.data) {
          throw new Error('API yanıtı boş veya geçersiz');
        }
        
        console.log(`Başarılı yanıt alındı: ${endpoint}`);
        console.log("API yanıtı (data):", response.data);
        
        // API response directly has the service data without a service property
        if (response.data && typeof response.data === 'object') {
          const serviceData = response.data.service || response.data;
          console.log("İşlenecek servis verisi:", serviceData);
          
          setFormData({
            title: serviceData.title || '',
            imageUrl: serviceData.imageUrl || '',
            shortDescription: serviceData.shortDescription || '',
            description: serviceData.description || '',
            price: serviceData.price || 0,
            isActive: serviceData.isActive !== undefined ? serviceData.isActive : true
          });
        } else {
          console.error("API yanıtı beklenen formatta değil:", response.data);
          setError('Hizmet bilgileri geçerli formatta değil.');
        }
      } catch (err) {
        console.error(`${endpoint} endpoint'i başarısız oldu:`, err);
        if (axios.isAxiosError(err)) {
          const status = err.response?.status || '';
          const errMessage = err.response?.data?.message || err.message;
          setError(`Hizmet bilgileri alınamadı (${status}): ${errMessage}`);
        } else {
          setError(`Hizmet bilgileri alınamadı: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
        }
      }
    } catch (error) {
      console.error('Hizmet bilgileri yüklenirken hata oluştu (detaylı):', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios hatası detayları:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        
        setError(`Hizmet bilgileri alınamadı: ${error.message}`);
      } else {
        setError(`Hizmet bilgileri alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // API URL'sini ve token'ı alıyoruz
      let token = localStorage.getItem('token') || '';
      let apiBaseUrl = API_BASE_URL;
      
      // Tarayıcının konsol'una özel debug komutları için destek
      if (window._debugApiUrl) {
        apiBaseUrl = window._debugApiUrl;
        console.log("Debug API URL kullanılıyor:", apiBaseUrl);
      }
      
      if (window._debugToken) {
        token = window._debugToken;
        console.log("Debug Token kullanılıyor");
      }
      
      const data = { ...formData };
      console.log("Gönderilen veri:", data);
      
      const updateUrl = `${apiBaseUrl}/admin/services/${serviceId}`;
      console.log(`PUT isteği yapılıyor: ${updateUrl}`);
      
      const response = await axios.put(updateUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("API güncelleme yanıtı:", response.data);
      
      setSuccess(true);
      
      // 1.5 saniye bekleyip modalı kapat ve başarılı işlemi bildir
      setTimeout(() => {
        onHide();
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Hizmet güncellenirken hata oluştu:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios hatası detayları:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        
        setError(`Hizmet güncellenirken hata: ${error.message} (${error.response?.status || 'bilinmeyen durum kodu'})`);
      } else {
        setError('Hizmet güncellenirken beklenmeyen bir hata oluştu.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      backdrop="static" 
      keyboard={false}
      centered
    >
      <Modal.Header closeButton style={{ borderBottom: 'none' }}>
        <Modal.Title style={{ color: colors.primary, fontWeight: 'bold' }}>
          Hizmet Düzenle (ID: {serviceId})
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" style={{ color: colors.primary }} />
            <p className="mt-2">Hizmet bilgileri yükleniyor...</p>
            <p className="text-muted small">
              API: {API_BASE_URL}/admin/services/{serviceId}
            </p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="danger">
                <div className="d-flex align-items-center mb-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" size="lg" />
                  <strong>Hata!</strong>
                </div>
                <p>{error}</p>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="outline-danger"
                    onClick={() => {
                      setError(null);
                      fetchServiceDetails();
                    }}
                  >
                    Tekrar Dene
                  </Button>
                </div>
              </Alert>
            )}
            
            {success && (
              <Alert variant="success">
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  <span>Hizmet başarıyla güncellendi!</span>
                </div>
              </Alert>
            )}
            
            <Row>
              <Col md={8}>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
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
                  
                  <Form.Group className="mb-3">
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
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Kısa Açıklama <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as="textarea"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleChange}
                      placeholder="Kısa açıklama girin"
                      required
                      className="shadow-sm"
                      rows={2}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Detaylı Açıklama <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Detaylı açıklama girin"
                      required
                      className="shadow-sm"
                      rows={4}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
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
                </Form>
              </Col>
              
              <Col md={4}>
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
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer style={{ borderTop: 'none' }}>
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          disabled={submitLoading}
        >
          İptal
        </Button>
        <Button 
          variant="success" 
          onClick={handleSubmit}
          disabled={submitLoading || loading}
          style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
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
              Güncelleniyor...
            </>
          ) : 'Kaydet'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ServiceEditModal; 