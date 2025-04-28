import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Table, Badge, Button, Modal, Form, Alert, Container, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faCheck, 
  faTimes, 
  faTrash, 
  faUserPlus, 
  faEdit, 
  faInfoCircle, 
  faEnvelope, 
  faCalendarCheck,
  faComments,
  faSync
} from '@fortawesome/free-solid-svg-icons';

interface NotificationReceiver {
  id: number;
  email: string;
  name: string;
  type: number;
  isActive: boolean;
  createdAt: string;
  isUpdating?: boolean;
}

// Bildirim türleri enum
enum NotificationType {
  Reservations = 1,  // Sadece rezervasyon bildirimleri
  ContactForms = 2,  // Sadece iletişim formu bildirimleri
  All = 3            // Tüm bildirimler (hem rezervasyonlar hem de iletişim formları)
}

const NotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [notificationReceivers, setNotificationReceivers] = useState<NotificationReceiver[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedReceiver, setSelectedReceiver] = useState<NotificationReceiver | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    type: 1,
    isActive: true
  });
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Ana renk ve diğer renkler
  const colors = {
    primary: '#0a6c3c',
    secondary: '#085330',
    info: '#0dcaf0',
    warning: '#ffc107',
    success: '#198754',
    error: '#dc3545',
    light: '#e8f5e9',
  };

  // Bildirim türü çevirisi
  const getNotificationTypeLabel = (type: number) => {
    switch (type) {
      case NotificationType.Reservations: return 'Rezervasyonlar';
      case NotificationType.ContactForms: return 'İletişim Formları';
      case NotificationType.All: return 'Tüm Bildirimler';
      default: return 'Bilinmeyen';
    }
  };

  // Tarihi formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Bildirimleri yenile
  const refreshNotifications = async () => {
    setRefreshing(true);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/notifications`);
      
      if (response.data.success) {
        setNotificationReceivers(response.data.data);
        setSuccessMessage('Bildirim alıcıları başarıyla yenilendi');
        setShowSuccessAlert(true);
        
        // 3 saniye sonra uyarıyı kapat
        setTimeout(() => setShowSuccessAlert(false), 3000);
      }
    } catch (error) {
      console.error('Bildirim alıcıları yüklenirken hata oluştu:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Bildirim alıcılarını getir
  useEffect(() => {
    const fetchNotificationReceivers = async () => {
      setLoading(true);
      
      try {
        // API_BASE_URL yapısını konsola yazdır
        console.log("API_BASE_URL:", API_BASE_URL);
        
        // Gerçek API çağrısı
        const response = await axios.get(`${API_BASE_URL}/admin/notifications`);
        
        if (response.data.success) {
          setNotificationReceivers(response.data.data);
        } else {
          console.error('Bildirim alıcıları alınamadı:', response.data.message);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Bildirim alıcıları yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };

    fetchNotificationReceivers();
  }, []);

  // Durum değiştir
  const toggleStatus = async (id: number) => {
    try {
      // Durumu değiştirmeden önce mevcut durumu alıyoruz
      const receiver = notificationReceivers.find(r => r.id === id);
      if (!receiver) {
        console.error('Bildirim alıcısı bulunamadı');
        return;
      }
      
      // API isteği sırasında UI'da loading göster
      const updatedReceivers = notificationReceivers.map(r => 
        r.id === id ? { ...r, isUpdating: true } : r
      );
      setNotificationReceivers(updatedReceivers as any);
      
      // Diğer tüm özellikler aynı kalacak, sadece isActive değişecek
      const updatedData = {
        name: receiver.name,
        email: receiver.email,
        type: receiver.type,
        isActive: !receiver.isActive
      };
      
      console.log(`Durum değiştiriliyor: ID=${id}, Mevcut=${receiver.isActive}, Yeni=${!receiver.isActive}`);
      console.log("Gönderilen veri:", updatedData);
      
      // Doğru URL: PUT /admin/notifications/{id}
      const response = await axios.put(`${API_BASE_URL}/admin/notifications/${id}`, updatedData);
      
      console.log('API yanıtı:', response.data);
      
      if (response.data.success) {
        // Durumu tersine çevirerek UI'ı güncelle
        const newStatus = !receiver.isActive;
        
        setNotificationReceivers(prevReceivers => 
          prevReceivers.map(r => 
            r.id === id ? { ...r, isActive: newStatus, isUpdating: false } : r
          )
        );
        
        // Başarı mesajı göster
        setSuccessMessage(`"${receiver.name}" durumu ${newStatus ? 'aktif' : 'pasif'} olarak güncellendi`);
        setShowSuccessAlert(true);
        
        // 3 saniye sonra uyarıyı kapat
        setTimeout(() => setShowSuccessAlert(false), 3000);
      } else {
        // Hata durumunda loading durumunu kaldır
        setNotificationReceivers(prevReceivers => 
          prevReceivers.map(r => 
            r.id === id ? { ...r, isUpdating: false } : r
          )
        );
        console.error('Durum değiştirilemedi:', response.data.message);
      }
    } catch (error) {
      console.error('Durum değiştirilirken hata oluştu:', error);
      
      // Hata durumunda loading durumunu kaldır
      setNotificationReceivers(prevReceivers => 
        prevReceivers.map(r => 
          r.id === id ? { ...r, isUpdating: false } : r
        )
      );
    }
  };

  // Bildirim alıcısını sil
  const deleteReceiver = async (id: number) => {
    try {
      // API isteği ile sil
      const response = await axios.delete(`${API_BASE_URL}/admin/notifications/${id}`);
      
      if (response.data.success) {
        // Silinen alıcı bilgisini al
        const deletedReceiver = notificationReceivers.find(r => r.id === id);
        
        // UI güncelleme
        setNotificationReceivers(prevReceivers => 
          prevReceivers.filter(receiver => receiver.id !== id)
        );

        if (showModal && selectedReceiver?.id === id) {
          setShowModal(false);
        }
        
        // Başarı mesajı göster
        setSuccessMessage(`"${deletedReceiver?.name}" başarıyla silindi`);
        setShowSuccessAlert(true);
        
        // 3 saniye sonra uyarıyı kapat
        setTimeout(() => setShowSuccessAlert(false), 3000);
      } else {
        console.error('Alıcı silinemedi:', response.data.message);
      }
    } catch (error) {
      console.error('Alıcı silinirken hata oluştu:', error);
    }
  };

  // Form alanlarını değiştir
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'type') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Yeni alıcı ekle
  const handleAddReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // API isteği ile ekle
      const response = await axios.post(`${API_BASE_URL}/admin/notifications`, formData);
      
      if (response.data.success) {
        // Başarılı ise API'den gelen veriyi kullan veya yeniden getir
        if (response.data.data) {
          setNotificationReceivers(prev => [...prev, response.data.data]);
        } else {
          // Tüm listeyi yeniden getir
          const refreshResponse = await axios.get(`${API_BASE_URL}/admin/notifications`);
          if (refreshResponse.data.success) {
            setNotificationReceivers(refreshResponse.data.data);
          }
        }
        
        // Başarı mesajı göster
        setSuccessMessage(`"${formData.name}" başarıyla eklendi`);
        setShowSuccessAlert(true);
        
        // 3 saniye sonra uyarıyı kapat
        setTimeout(() => setShowSuccessAlert(false), 3000);
      } else {
        console.error('Alıcı eklenemedi:', response.data.message);
      }
      
      // Formu sıfırla ve kapat
      setFormData({
        email: '',
        name: '',
        type: 1,
        isActive: true
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Alıcı eklenirken hata oluştu:', error);
    }
  };

  // Alıcıyı düzenle
  const handleEditReceiver = (receiver: NotificationReceiver) => {
    setSelectedReceiver(receiver);
    setFormData({
      email: receiver.email,
      name: receiver.name,
      type: receiver.type,
      isActive: receiver.isActive
    });
    setShowAddModal(true);
  };

  // Alıcıyı güncelle
  const handleUpdateReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReceiver) return;
    
    try {
      // API isteği ile güncelle
      const response = await axios.put(`${API_BASE_URL}/admin/notifications/${selectedReceiver.id}`, formData);
      
      if (response.data.success) {
        // UI güncelleme
        setNotificationReceivers(prev => 
          prev.map(receiver => 
            receiver.id === selectedReceiver.id 
              ? { 
                  ...receiver, 
                  email: formData.email,
                  name: formData.name,
                  type: formData.type,
                  isActive: formData.isActive
                } 
              : receiver
          )
        );
        
        // Başarı mesajı göster
        setSuccessMessage(`"${formData.name}" başarıyla güncellendi`);
        setShowSuccessAlert(true);
        
        // 3 saniye sonra uyarıyı kapat
        setTimeout(() => setShowSuccessAlert(false), 3000);
      } else {
        console.error('Alıcı güncellenemedi:', response.data.message);
      }
      
      // Formu sıfırla ve kapat
      setFormData({
        email: '',
        name: '',
        type: 1,
        isActive: true
      });
      setShowAddModal(false);
      setSelectedReceiver(null);
    } catch (error) {
      console.error('Alıcı güncellenirken hata oluştu:', error);
    }
  };

  // Bildirim türüne göre ikon getir
  const getNotificationTypeIcon = (type: number) => {
    switch (type) {
      case NotificationType.Reservations: return faCalendarCheck;
      case NotificationType.ContactForms: return faComments;
      case NotificationType.All: return faBell;
      default: return faInfoCircle;
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: colors.primary }} />
        <p className="mt-2">Bildirim alıcıları yükleniyor...</p>
      </div>
    );
  }

  return (
    <Container fluid className="px-0">
      {/* Başarı mesajı */}
      {showSuccessAlert && (
        <Alert 
          variant="success" 
          className="animate__animated animate__fadeIn position-fixed top-0 start-50 translate-middle-x mt-3"
          style={{ zIndex: 1050, maxWidth: '80%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          <FontAwesomeIcon icon={faCheck} className="me-2" />
          {successMessage}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '0' }}>
                    <FontAwesomeIcon icon={faBell} className="me-2" />
                    Bildirim Yönetimi
                  </h2>
                  <p className="text-muted mb-0 mt-1">
                    Sistem bildirimleri alacak kişilerin yönetimi
                  </p>
                </div>
                <div className="d-flex">
                  <Button 
                    variant="outline-secondary" 
                    className="d-flex align-items-center me-2"
                    onClick={refreshNotifications}
                    disabled={refreshing}
                  >
                    <FontAwesomeIcon icon={faSync} className={`me-1 ${refreshing ? 'fa-spin' : ''}`} />
                    Yenile
                  </Button>
                  <Button 
                    variant="success" 
                    className="d-flex align-items-center"
                    onClick={() => {
                      setSelectedReceiver(null);
                      setFormData({
                        email: '',
                        name: '',
                        type: 1,
                        isActive: true
                      });
                      setShowAddModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                    Yeni Alıcı Ekle
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col lg={3} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title text-primary mb-3">Hızlı Bilgi</h5>
              <p className="text-muted small">
                Bu sayfa, sistem bildirimlerini alacak kişileri yönetmenizi sağlar. 
                Alıcılar, belirli olay türleri için e-posta bildirimleri alırlar.
              </p>
              <hr />
              <h6 className="text-dark mb-2 small">Bildirim Türleri:</h6>
              <ul className="list-unstyled small">
                <li className="mb-2">
                  <FontAwesomeIcon icon={faCalendarCheck} className="me-1 text-info" />
                  <strong>Rezervasyonlar:</strong> Sadece rezervasyon bildirimleri
                </li>
                <li className="mb-2">
                  <FontAwesomeIcon icon={faComments} className="me-1 text-warning" />
                  <strong>İletişim Formları:</strong> Sadece iletişim formu bildirimleri
                </li>
                <li>
                  <FontAwesomeIcon icon={faBell} className="me-1 text-primary" />
                  <strong>Tüm Bildirimler:</strong> Hem rezervasyonlar hem de iletişim formları
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={9}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {notificationReceivers.length === 0 ? (
                <div className="text-center p-5">
                  <FontAwesomeIcon icon={faEnvelope} className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                  <h5 className="text-muted">Hiç bildirim alıcısı bulunmuyor</h5>
                  <p className="mb-3">Sistem olayları hakkında bildirim alacak kişileri ekleyebilirsiniz.</p>
                  <Button 
                    variant="success" 
                    onClick={() => {
                      setSelectedReceiver(null);
                      setFormData({
                        email: '',
                        name: '',
                        type: 1,
                        isActive: true
                      });
                      setShowAddModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    İlk Alıcıyı Ekle
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>İsim</th>
                      <th>E-posta</th>
                      <th>Bildirim Türü</th>
                      <th>Durum</th>
                      <th>Eklenme Tarihi</th>
                      <th className="text-end" style={{ minWidth: '160px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificationReceivers.map(receiver => (
                      <tr key={receiver.id} style={{ 
                        transition: 'all 0.2s',
                        backgroundColor: receiver.isActive ? 'white' : '#f8f9fa'
                      }}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-2" 
                              style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '50%', 
                                backgroundColor: colors.light,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem'
                              }}
                            >
                              {receiver.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold">{receiver.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faEnvelope} className="me-2 text-secondary" />
                            {receiver.email}
                          </div>
                        </td>
                        <td>
                          <Badge 
                            pill
                            className="d-flex align-items-center justify-content-center"
                            style={{ 
                              width: 'fit-content',
                              padding: '0.35rem 0.75rem',
                              backgroundColor: 
                                receiver.type === NotificationType.Reservations ? colors.info :
                                receiver.type === NotificationType.ContactForms ? colors.warning :
                                receiver.type === NotificationType.All ? colors.primary : 'secondary'
                            }}
                          >
                            <FontAwesomeIcon icon={getNotificationTypeIcon(receiver.type)} className="me-1" />
                            {getNotificationTypeLabel(receiver.type)}
                          </Badge>
                        </td>
                        <td>
                          <Badge 
                            pill
                            bg={receiver.isActive ? 'success' : 'danger'}
                            className="px-3 py-2"
                          >
                            {receiver.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </td>
                        <td>{formatDate(receiver.createdAt)}</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>{receiver.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}</Tooltip>}
                            >
                              <Button 
                                variant={receiver.isActive ? 'outline-danger' : 'outline-success'} 
                                size="sm" 
                                className="me-1"
                                onClick={() => toggleStatus(receiver.id)}
                                disabled={receiver.isUpdating}
                              >
                                {receiver.isUpdating ? (
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <FontAwesomeIcon icon={receiver.isActive ? faTimes : faCheck} />
                                )}
                              </Button>
                            </OverlayTrigger>
                            
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Düzenle</Tooltip>}
                            >
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleEditReceiver(receiver)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                            </OverlayTrigger>
                            
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Sil</Tooltip>}
                            >
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => deleteReceiver(receiver.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </OverlayTrigger>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alıcı Ekleme/Düzenleme Modal */}
      <Modal 
        show={showAddModal} 
        onHide={() => setShowAddModal(false)}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton style={{ backgroundColor: colors.primary, color: 'white' }}>
          <Modal.Title>
            <FontAwesomeIcon icon={selectedReceiver ? faEdit : faUserPlus} className="me-2" />
            {selectedReceiver ? 'Bildirim Alıcısını Düzenle' : 'Yeni Bildirim Alıcısı Ekle'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={selectedReceiver ? handleUpdateReceiver : handleAddReceiver}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faUserPlus} className="me-1" /> İsim
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Alıcı adı"
                    autoFocus
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faEnvelope} className="me-1" /> E-posta
                  </Form.Label>
                  <Form.Control 
                    type="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="ornek@email.com"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faBell} className="me-1" /> Bildirim Türü
                  </Form.Label>
                  <Form.Select 
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="form-select-lg"
                  >
                    <option value={NotificationType.Reservations}>Rezervasyonlar</option>
                    <option value={NotificationType.ContactForms}>İletişim Formları</option>
                    <option value={NotificationType.All}>Tüm Bildirimler</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3 d-flex align-items-end" style={{ height: '100%' }}>
                  <Form.Check 
                    type="switch"
                    id="active-switch"
                    name="isActive"
                    label="Bildirimler aktif olsun"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mt-3 form-switch"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <hr />
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" onClick={() => setShowAddModal(false)}>
                <FontAwesomeIcon icon={faTimes} className="me-1" /> İptal
              </Button>
              <Button variant="success" type="submit">
                <FontAwesomeIcon icon={selectedReceiver ? faCheck : faUserPlus} className="me-1" />
                {selectedReceiver ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default NotificationsPage; 