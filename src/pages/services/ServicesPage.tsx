import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, Form, Modal, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faPencilAlt, 
  faTrashAlt, 
  faSync, 
  faSearch, 
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
  faEye,
  faTags,
  faMoneyBillWave,
  faCoins,
  faFilter,
  faList
} from '@fortawesome/free-solid-svg-icons';
import ServiceEditModal from '../../components/services/ServiceEditModal';
import ServiceToggleStatusModal from '../../components/services/ServiceToggleStatusModal';
import './ServicesPage.css';

interface Service {
  id: number;
  title: string;
  imageUrl: string;
  shortDescription: string;
  price: number;
  isActive: boolean;
  description?: string;
}

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<number | null>(null);
  const [showToggleStatusModal, setShowToggleStatusModal] = useState<boolean>(false);
  const navigate = useNavigate();

  // Yeşil renk paleti - diğer sayfalarla uyumlu
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
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, statusFilter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/admin/services/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("API yanıtı:", response.data);

      if (response.data.isSuccess) {
        console.log("Alınan hizmetler:", response.data.services);
        // Hizmet listesi API yanıtında doğru formatta mı kontrol ediyoruz
        const services = response.data.services || [];
        // isActive değerinin olduğundan emin oluyoruz
        const servicesWithActiveStatus = services.map((service: any) => ({
          ...service,
          isActive: service.isActive !== undefined ? service.isActive : true
        }));
        setServices(servicesWithActiveStatus);
      } else {
        setError('Hizmetler yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Hizmetler yüklenirken hata oluştu:', error);
      setError('Hizmetler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];
    
    // Önce durum filtresini uygula
    if (statusFilter === 'active') {
      filtered = filtered.filter(service => service.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(service => !service.isActive);
    }
    
    // Sonra arama terimini uygula
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(term) || 
        service.shortDescription.toLowerCase().includes(term)
      );
    }
    
    setFilteredServices(filtered);
  };

  const handleAddService = () => {
    navigate('/services/new');
  };

  const handleEditService = (id: number) => {
    // Modal için seçilen servisi ayarla ve göster
    setSelectedServiceForEdit(id);
    setShowEditModal(true);
  };

  const showDeleteConfirmation = (service: Service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const showServiceDetails = async (service: Service) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/admin/services/${service.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.isSuccess) {
        console.log("Hizmet detayı:", response.data);
        // API yanıtında service doğrudan obje olarak geliyor olabilir
        const serviceData = response.data.service || response.data;
        setSelectedService({
          ...serviceData,
          isActive: serviceData.isActive !== undefined ? serviceData.isActive : true
        });
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Hizmet detayları alınırken hata oluştu:', error);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE_URL}/admin/services/${selectedService.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Hizmet başarıyla silindiğinde listeyi güncelle
      fetchServices();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Hizmet silinirken hata oluştu:', error);
      alert('Hizmet silinirken bir hata oluştu.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleServiceStatus = async (serviceId: number, newStatus: boolean) => {
    // Doğrudan API çağrısı yapmak yerine, seçilen servisi bul ve modal'ı göster
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setShowToggleStatusModal(true);
    }
  };

  // Fiyat formatı
  const formatPrice = (price: number) => {
    return `${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
  };

  const getServiceStats = () => {
    return {
      total: services.length,
      averagePrice: services.length > 0 ? 
        services.reduce((sum, service) => sum + service.price, 0) / services.length : 0
    };
  };

  const stats = getServiceStats();

  if (loading && services.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: colors.primary }} />
        <p className="mt-2">Hizmetler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: colors.primary, fontWeight: 'bold' }}>Hizmet Yönetimi</h2>
        <Button 
          variant="success" 
          onClick={handleAddService}
          style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Yeni Hizmet Ekle
        </Button>
      </div>

      {/* İstatistikler */}
      <Row className="mb-4">
        <Col md={6} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.primary}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Toplam Hizmet</p>
                  <h3 className="fw-bold mb-0">{stats.total}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: colors.light }}>
                  <FontAwesomeIcon icon={faTags} size="lg" style={{ color: colors.primary }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.warning}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Ortalama Fiyat</p>
                  <h3 className="fw-bold mb-0">{formatPrice(stats.averagePrice)}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#fff3cd' }}>
                  <FontAwesomeIcon icon={faMoneyBillWave} size="lg" style={{ color: colors.warning }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Arama ve Yenile */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ color: colors.primary }} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Hizmet adı veya açıklama ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #ced4da' }}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text style={{ 
                  backgroundColor: colors.light, 
                  border: 'none' 
                }}>
                  <FontAwesomeIcon 
                    icon={faFilter} 
                    style={{ 
                      color: statusFilter === 'all' 
                        ? colors.primary 
                        : statusFilter === 'active' 
                          ? colors.success 
                          : colors.danger 
                    }} 
                  />
                </InputGroup.Text>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  style={{ 
                    border: 'none', 
                    borderBottom: '1px solid #ced4da',
                    color: statusFilter === 'all' 
                      ? undefined 
                      : statusFilter === 'active' 
                        ? colors.success 
                        : colors.danger,
                    fontWeight: statusFilter === 'all' ? 'normal' : 'bold'
                  }}
                  className="filter-select"
                >
                  <option value="all">Tüm Hizmetler</option>
                  <option value="active">Sadece Aktif Hizmetler</option>
                  <option value="inactive">Sadece Pasif Hizmetler</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3} className="d-flex justify-content-end align-items-center">
              <Button 
                variant="outline-secondary" 
                onClick={fetchServices} 
                className="d-flex align-items-center"
              >
                <FontAwesomeIcon icon={faSync} className="me-2" />
                Yenile
              </Button>
              <Badge 
                className={`ms-3 py-2 px-3 service-count ${statusFilter !== 'all' || searchTerm ? 'filtered' : ''}`}
                bg={statusFilter !== 'all' ? (statusFilter === 'active' ? 'success' : 'danger') : 'secondary'}
                style={{ opacity: 0.8 }}
              >
                <FontAwesomeIcon 
                  icon={statusFilter === 'all' ? faList : (statusFilter === 'active' ? faCheckCircle : faTimesCircle)} 
                  className="me-1" 
                />
                {filteredServices.length} {statusFilter === 'all' 
                  ? 'Hizmet' 
                  : statusFilter === 'active' 
                    ? 'Aktif Hizmet' 
                    : 'Pasif Hizmet'
                }
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <div className="alert alert-danger mb-4">
          <p className="mb-0">{error}</p>
          <Button variant="link" className="p-0 text-danger" onClick={fetchServices}>
            Tekrar Dene
          </Button>
        </div>
      )}

      {filteredServices.length === 0 && !loading ? (
        <Card className="border-0 shadow-sm text-center p-5">
          <Card.Body>
            {searchTerm ? (
              <>
                <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 text-muted" />
                <p>Aranan kriterlere uygun hizmet bulunamadı.</p>
                <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                  Aramayı Temizle
                </Button>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTags} size="3x" className="mb-3 text-muted" />
                <p>Henüz hizmet bulunmamaktadır.</p>
                <Button 
                  variant="success" 
                  onClick={handleAddService}
                  style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  İlk Hizmeti Ekle
                </Button>
              </>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {filteredServices.map((service) => (
            <Col key={service.id} lg={4} md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm hover-shadow transition-all" 
                    style={{ transition: 'all 0.3s ease', overflow: 'hidden' }}>
                <div className="position-relative">
                  {service.imageUrl ? (
                    <Card.Img 
                      variant="top" 
                      src={service.imageUrl} 
                      alt={service.title}
                      style={{ 
                        height: '200px', 
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease'
                      }}
                    />
                  ) : (
                    <div 
                      className="d-flex justify-content-center align-items-center"
                      style={{ height: '200px', backgroundColor: colors.light }}
                    >
                      <FontAwesomeIcon 
                        icon={faInfoCircle} 
                        size="3x" 
                        style={{ color: colors.primary, opacity: 0.5 }}
                      />
                    </div>
                  )}
                  
                  <Badge 
                    className="position-absolute top-0 end-0 m-2 rounded-pill shadow-sm" 
                    bg={service.isActive ? 'success' : 'danger'}
                    style={{ padding: '6px 12px' }}
                  >
                    <FontAwesomeIcon icon={service.isActive ? faCheckCircle : faTimesCircle} className="me-1" />
                    <span className="fw-normal">{service.isActive ? 'Aktif Hizmet' : 'Pasif Hizmet'}</span>
                  </Badge>
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-truncate mb-2">{service.title}</Card.Title>
                  <Card.Text 
                    className="text-muted flex-grow-1" 
                    style={{ 
                      height: '52px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {service.shortDescription}
                  </Card.Text>
                  
                  <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
                    <h5 className="mb-0 fw-bold price-tag" style={{ color: service.price === 0 ? colors.success : colors.primary }}>
                      {service.price === 0 ? (
                        <>
                          <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                          Ücretsiz
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCoins} className="me-1" />
                          {formatPrice(service.price)}
                        </>
                      )}
                    </h5>
                    <small className="text-muted">ID: {service.id}</small>
                  </div>
                  
                  <div className="d-flex gap-2 mt-auto">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => showServiceDetails(service)}
                      className="flex-grow-1"
                      style={{ color: colors.primary, borderColor: colors.primary }}
                    >
                      <FontAwesomeIcon icon={faEye} className="me-1 icon" />
                      <span className="text">Görüntüle</span>
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => handleEditService(service.id)}
                      className="flex-grow-1"
                    >
                      <FontAwesomeIcon icon={faPencilAlt} className="me-1 icon" />
                      <span className="text">Düzenle</span>
                    </Button>
                    <Button 
                      variant={service.isActive ? "outline-warning" : "outline-success"}
                      onClick={() => handleToggleServiceStatus(service.id, !service.isActive)}
                      title={service.isActive ? "Pasif yap: Hizmeti kullanıcılara gösterme" : "Aktif yap: Hizmeti kullanıcılara göster"}
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: '38px', height: '38px', padding: '0' }}
                    >
                      <FontAwesomeIcon 
                        icon={service.isActive ? faTimesCircle : faCheckCircle} 
                        size="lg" 
                        className="icon"
                        style={{ color: service.isActive ? colors.warning : colors.success }}
                      />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      onClick={() => showDeleteConfirmation(service)}
                      title="Hizmeti sil"
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: '38px', height: '38px', padding: '0' }}
                    >
                      <FontAwesomeIcon icon={faTrashAlt} className="icon" />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Hizmet Düzenleme Modalı */}
      <ServiceEditModal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        serviceId={selectedServiceForEdit} 
        onSuccess={() => {
          fetchServices();
          setShowEditModal(false);
        }} 
      />
      
      {/* Hizmet Durumu Değiştirme Modalı */}
      {selectedService && (
        <ServiceToggleStatusModal
          show={showToggleStatusModal}
          onHide={() => setShowToggleStatusModal(false)}
          serviceId={selectedService.id}
          currentStatus={selectedService.isActive}
          serviceName={selectedService.title}
          onSuccess={() => {
            fetchServices();
            setShowToggleStatusModal(false);
          }}
        />
      )}
      
      {/* Hizmet Silme Modalı */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Hizmet Silme Onayı</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>{selectedService?.title}</strong> hizmetini silmek istediğinizden emin misiniz?
          </p>
          <p className="text-danger">Bu işlem geri alınamaz!</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteService} 
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Siliniyor...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrashAlt} className="me-2" />
                Sil
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Hizmet Detay Modalı */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: colors.light }}>
          <Modal.Title>{selectedService?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedService?.imageUrl && (
            <div className="text-center mb-3">
              <img 
                src={selectedService.imageUrl} 
                alt={selectedService.title} 
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
              />
            </div>
          )}
          
          <div className="d-flex justify-content-between mb-3">
            <div>
              <h6 className="mb-1 text-muted">Fiyat</h6>
              <h5 className="mb-0">
                {selectedService?.price === 0 ? 'Ücretsiz' : formatPrice(selectedService?.price || 0)}
              </h5>
            </div>
            <div>
              <h6 className="mb-1 text-muted">Durum</h6>
              <Badge 
                bg={selectedService?.isActive ? 'success' : 'danger'} 
                className="rounded-pill py-1 px-2"
              >
                <FontAwesomeIcon icon={selectedService?.isActive ? faCheckCircle : faTimesCircle} className="me-1" />
                {selectedService?.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
          </div>
          
          <h6 className="text-muted mb-1">Kısa Açıklama</h6>
          <p>{selectedService?.shortDescription}</p>
          
          <h6 className="text-muted mb-1">Detaylı Açıklama</h6>
          <p style={{ whiteSpace: 'pre-line' }}>{selectedService?.description}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowViewModal(false)}
          >
            Kapat
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => {
              setShowViewModal(false);
              if (selectedService) handleEditService(selectedService.id);
            }}
            style={{ color: colors.primary, borderColor: colors.primary }}
          >
            <FontAwesomeIcon icon={faPencilAlt} className="me-1" />
            Düzenle
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ServicesPage; 