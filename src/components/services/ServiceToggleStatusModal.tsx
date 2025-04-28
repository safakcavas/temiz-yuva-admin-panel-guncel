import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { API_BASE_URL } from '../../config/api';

interface ServiceToggleStatusModalProps {
  show: boolean;
  onHide: () => void;
  serviceId: number | null;
  currentStatus: boolean;
  serviceName: string;
  onSuccess: () => void;
}

interface ServiceData {
  id: number;
  title: string;
  imageUrl: string;
  shortDescription: string;
  description: string;
  price: number;
  isActive: boolean;
}

const ServiceToggleStatusModal: React.FC<ServiceToggleStatusModalProps> = ({
  show,
  onHide,
  serviceId,
  currentStatus,
  serviceName,
  onSuccess
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [serviceData, setServiceData] = useState<Partial<ServiceData> | null>(null);

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

  // API'den servis detaylarını almak için useEffect
  useEffect(() => {
    if (show && serviceId) {
      fetchServiceDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, serviceId]);

  // Servis detaylarını getiren fonksiyon
  const fetchServiceDetails = async () => {
    if (!serviceId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // API endpoint'lerini deneyelim
      const endpoints = [
        `${API_BASE_URL}/admin/services/${serviceId}`,
        `${API_BASE_URL}/admin/service/${serviceId}`,
        `${API_BASE_URL}/services/${serviceId}`
      ];
      
      let serviceDetails = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Servis detayları alınıyor: ${endpoint}`);
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data) {
            const data = response.data.service || response.data;
            serviceDetails = {
              id: data.id || serviceId,
              title: data.title || serviceName,
              imageUrl: data.imageUrl || '',
              shortDescription: data.shortDescription || '',
              description: data.description || '',
              price: data.price || 0,
              isActive: currentStatus // mevcut durumu başlangıç değeri olarak kullan
            };
            console.log('Servis detayları alındı:', serviceDetails);
            break;
          }
        } catch (err) {
          console.log(`${endpoint} başarısız oldu, diğer endpoint deneniyor...`);
        }
      }
      
      if (serviceDetails) {
        setServiceData(serviceDetails);
      } else {
        // Detay alınamazsa minimal veri ile devam et
        setServiceData({
          id: serviceId,
          title: serviceName,
          isActive: currentStatus
        });
      }
    } catch (error) {
      console.error('Servis detayları alınırken hata oluştu:', error);
      // Hata olsa bile minimal veri ile devam et
      setServiceData({
        id: serviceId,
        title: serviceName,
        isActive: currentStatus
      });
    }
  };

  const handleToggleStatus = async () => {
    if (!serviceId) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      const newStatus = !currentStatus;
      
      // Servis verilerini kullan veya minimal veriyi oluştur
      const currentService = serviceData || {
        id: serviceId,
        title: serviceName,
        isActive: currentStatus
      };
      
      // Güncellenmiş servis verisi
      const updatedService = {
        ...currentService,
        isActive: newStatus
      };
      
      // Farklı API endpoint ve istek tipleri deneyeceğiz
      const apiEndpoints = [
        // Sadece durum güncellemesi
        {
          url: `${API_BASE_URL}/admin/services/${serviceId}/status`,
          method: 'patch',
          data: { isActive: newStatus }
        },
        // Tam PUT isteği
        {
          url: `${API_BASE_URL}/admin/services/${serviceId}`,
          method: 'put',
          data: updatedService
        },
        // Sadece durumu PATCH ile güncelle
        {
          url: `${API_BASE_URL}/admin/services/${serviceId}`,
          method: 'patch',
          data: { isActive: newStatus }
        },
        // Alternatif endpoint
        {
          url: `${API_BASE_URL}/admin/service/${serviceId}`,
          method: 'put',
          data: updatedService
        },
        // ID olmadan istek dene
        {
          url: `${API_BASE_URL}/admin/services`,
          method: 'put',
          data: updatedService
        }
      ];
      
      let success = false;
      let successResponse = null;
      
      // Her bir endpoint'i sırayla deneyelim
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`${endpoint.method.toUpperCase()} isteği deneniyor: ${endpoint.url}`);
          console.log('Gönderilen veri:', endpoint.data);
          
          let response;
          if (endpoint.method === 'patch') {
            response = await axios.patch(
              endpoint.url,
              endpoint.data,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                }
              }
            );
          } else {
            response = await axios.put(
              endpoint.url,
              endpoint.data,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                }
              }
            );
          }
          
          console.log(`API yanıtı başarılı:`, response.data);
          success = true;
          successResponse = response;
          break;
        } catch (err) {
          if (axios.isAxiosError(err)) {
            console.error(`${endpoint.url} denemesi başarısız oldu:`, {
              status: err.response?.status,
              data: err.response?.data,
              message: err.message
            });
          } else {
            console.error(`${endpoint.url} denemesi başarısız oldu:`, err);
          }
        }
      }
      
      if (!success) {
        throw new Error('Hiçbir API isteği başarılı olmadı');
      }
      
      console.log(`Hizmet durumu başarıyla güncellendi: ${newStatus ? 'Aktif' : 'Pasif'}`);
      setSuccess(true);
      
      // 1.5 saniye bekleyip modalı kapat ve başarılı işlemi bildir
      setTimeout(() => {
        onHide();
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Hizmet durumu değiştirilirken hata oluştu:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || '';
        const responseData = error.response?.data ? JSON.stringify(error.response.data) : '';
        setError(`Hizmet durumu güncellenirken bir hata oluştu (${status}): ${error.message}. ${responseData}`);
      } else if (error instanceof Error) {
        setError(`Hizmet durumu güncellenirken bir hata oluştu: ${error.message}`);
      } else {
        setError('Hizmet durumu güncellenirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Hizmet Durumu Değiştir</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="d-flex align-items-center mb-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            <div>
              <div className="fw-bold mb-1">İşlem Başarısız</div>
              <p className="mb-0 small">
                {error.includes('Hiçbir API isteği başarılı olmadı') ? 
                  'Sunucu ile iletişim kurulamadı. Lütfen daha sonra tekrar deneyiniz.' : error}
              </p>
              <Button 
                variant="link" 
                className="p-0 mt-2 text-danger" 
                size="sm"
                onClick={handleToggleStatus}
              >
                Tekrar Dene
              </Button>
            </div>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="d-flex align-items-center mb-3">
            <FontAwesomeIcon icon={faCheckCircle} className="me-2" size="lg" />
            <div>
              <div className="fw-bold">İşlem Başarılı</div>
              <p className="mb-0">
                <strong>{serviceName}</strong> hizmeti başarıyla 
                <strong className={currentStatus ? " text-danger" : " text-success"}>
                  {' '}{currentStatus ? 'pasif' : 'aktif'}{' '}
                </strong>
                yapıldı.
              </p>
            </div>
          </Alert>
        )}
        
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" className="mb-2" />
            <p>Hizmet durumu güncelleniyor, lütfen bekleyin...</p>
          </div>
        )}
        
        {!loading && !success && !error && (
          <div>
            <p>
              <strong>{serviceName}</strong> adlı hizmeti 
              <strong className={currentStatus ? " text-danger" : " text-success"}>
                {' '}{currentStatus ? 'pasif' : 'aktif'}{' '}
              </strong>
              yapmak istediğinizden emin misiniz?
            </p>
            <div className="p-3 bg-light rounded mb-3">
              <h6 className="mb-2">{currentStatus ? 'Pasif Yapma' : 'Aktif Yapma'} İşlemi:</h6>
              <ul className="small mb-0">
                {currentStatus ? (
                  <>
                    <li><strong>Pasif hizmetler</strong> kullanıcılara gösterilmez.</li>
                    <li>Kullanıcılar bu hizmeti göremez ve rezervasyon yapamaz.</li>
                    <li>Hizmet içeriği ve ayarları değiştirilmez, sadece görünürlüğü kapatılır.</li>
                    <li>İstediğiniz zaman tekrar aktif yapabilirsiniz.</li>
                  </>
                ) : (
                  <>
                    <li><strong>Aktif hizmetler</strong> kullanıcılara gösterilir.</li>
                    <li>Kullanıcılar bu hizmeti görebilir ve rezervasyon yapabilir.</li>
                    <li>Hizmeti aktif yaparak müşterilerin erişimine açarsınız.</li>
                    <li>İstediğiniz zaman tekrar pasif yapabilirsiniz.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          {success ? 'Kapat' : 'İptal'}
        </Button>
        {!success && (
          <Button 
            variant={currentStatus ? "warning" : "success"}
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                İşleniyor...
              </>
            ) : (
              currentStatus ? 'Pasif Yap' : 'Aktif Yap'
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ServiceToggleStatusModal; 