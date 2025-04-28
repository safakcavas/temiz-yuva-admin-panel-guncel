import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Row, Col, Tabs, Tab, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComment, 
  faStar, 
  faTrash, 
  faExclamationTriangle,
  faCheckCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

interface Rating {
  id: number;
  reservationId: number;
  serviceTitle: string;
  userFullName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isApproved: boolean;
}

const RatingsPage: React.FC = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  // Renk paleti
  const colors = {
    primary: '#0a6c3c',
    secondary: '#174',
    light: '#e8f5e9',
    dark: '#085330',
    warning: '#ffc107',
    danger: '#dc3545',
    success: '#28a745'
  };

  // Değerlendirmeleri yükle
  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/ratings`);
      if (response.data.success) {
        setRatings(response.data.data);
      } else {
        setError(response.data.message || 'Değerlendirmeler yüklenirken bir hata oluştu');
      }
    } catch (err: any) {
      console.error('Değerlendirmeler yüklenirken hata:', err);
      setError('Değerlendirmeler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Değerlendirme silme
  const handleDelete = async () => {
    if (!selectedRating) return;
    
    setDeleteLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/admin/ratings/${selectedRating.id}`);
      if (response.data.success) {
        setRatings(ratings.filter(r => r.id !== selectedRating.id));
        toast.success('Değerlendirme başarıyla silindi');
        setShowDeleteModal(false);
      } else {
        toast.error(response.data.message || 'Değerlendirme silinirken hata oluştu');
      }
    } catch (err: any) {
      console.error('Değerlendirme silinirken hata:', err);
      toast.error('Değerlendirme silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Değerlendirme silme modalını aç
  const handleOpenDeleteModal = (rating: Rating) => {
    setSelectedRating(rating);
    setShowDeleteModal(true);
  };

  // Değerlendirme onaylama
  const handleApprove = async (rating: Rating) => {
    setApproveLoading(true);
    
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/ratings/${rating.id}/approve?approve=true`);
      
      if (response.data.success) {
        // Güncel verileri getir
        setRatings(ratings.map(r => 
          r.id === rating.id ? { ...r, isApproved: true } : r
        ));
        toast.success('Değerlendirme onaylandı');
      } else {
        toast.error(response.data.message || 'Değerlendirme onaylanırken hata oluştu');
      }
    } catch (err: any) {
      console.error('Değerlendirme onaylanırken hata:', err);
      toast.error('Değerlendirme onaylanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setApproveLoading(false);
    }
  };

  // Değerlendirme reddetme
  const handleReject = async (rating: Rating) => {
    setApproveLoading(true);
    
    try {
      const response = await axios.put(`${API_BASE_URL}/admin/ratings/${rating.id}/approve?approve=false`);
      
      if (response.data.success) {
        // Güncel verileri getir
        setRatings(ratings.map(r => 
          r.id === rating.id ? { ...r, isApproved: false } : r
        ));
        toast.success('Değerlendirme onayı kaldırıldı');
      } else {
        toast.error(response.data.message || 'Değerlendirme onayı kaldırılırken hata oluştu');
      }
    } catch (err: any) {
      console.error('Değerlendirme reddedilirken hata:', err);
      toast.error('Değerlendirme onayı kaldırılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setApproveLoading(false);
    }
  };

  // Yıldız gösterim bileşeni
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div>
        {rating === 0 ? (
          <span className="text-muted">Değerlendirilmemiş</span>
        ) : (
          [...Array(5)].map((_, i) => (
            <FontAwesomeIcon 
              key={i} 
              icon={faStar} 
              style={{ 
                color: i < rating ? colors.warning : '#e4e5e9',
                marginRight: '2px'
              }} 
            />
          ))
        )}
      </div>
    );
  };

  // Filtrelenmiş değerlendirmeler
  const approvedRatings = ratings.filter(rating => rating.isApproved);
  const pendingRatings = ratings.filter(rating => !rating.isApproved);

  // İstatistikler
  const stats = {
    total: ratings.length,
    approved: approvedRatings.length,
    pending: pendingRatings.length,
    averageRating: approvedRatings.filter(r => r.rating > 0).length > 0 
      ? (approvedRatings.filter(r => r.rating > 0).reduce((sum, r) => sum + r.rating, 0) / approvedRatings.filter(r => r.rating > 0).length)
      : 0,
    fiveStarCount: ratings.filter(r => r.rating === 5).length
  };

  if (loading && ratings.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: colors.primary }} />
        <p className="mt-2">Değerlendirmeler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: colors.primary, fontWeight: 'bold' }}>Kullanıcı Değerlendirmeleri</h2>
        <Button 
          variant="outline-primary" 
          onClick={() => fetchRatings()}
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          Yenile
        </Button>
      </div>

      {/* İstatistikler */}
      <Row className="mb-4">
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.primary}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Toplam Değerlendirme</p>
                  <h3 className="fw-bold mb-0">{stats.total}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: colors.light }}>
                  <FontAwesomeIcon icon={faComment} size="lg" style={{ color: colors.primary }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.warning}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Ortalama Puan</p>
                  <h3 className="fw-bold mb-0">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#fff3cd' }}>
                  <FontAwesomeIcon icon={faStar} size="lg" style={{ color: colors.warning }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.success}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Onaylı Değerlendirmeler</p>
                  <h3 className="fw-bold mb-0">{stats.approved}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#d1e7dd' }}>
                  <FontAwesomeIcon icon={faCheckCircle} size="lg" style={{ color: colors.success }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.danger}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Bekleyen Değerlendirmeler</p>
                  <h3 className="fw-bold mb-0">{stats.pending}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#f8d7da' }}>
                  <FontAwesomeIcon icon={faTimes} size="lg" style={{ color: colors.danger }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'pending')}
            className="mb-4"
          >
            <Tab 
              eventKey="pending" 
              title={
                <span>
                  <FontAwesomeIcon icon={faTimes} className="me-1" />
                  Onay Bekleyenler <Badge bg="danger">{pendingRatings.length}</Badge>
                </span>
              }
            >
              {pendingRatings.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">Onay bekleyen değerlendirme bulunmuyor.</p>
                </div>
              ) : (
                <RatingsTable 
                  ratings={pendingRatings} 
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleOpenDeleteModal}
                  approveLoading={approveLoading}
                  showApproveButton={true}
                  showRejectButton={false}
                />
              )}
            </Tab>
            <Tab 
              eventKey="approved" 
              title={
                <span>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                  Onaylananlar <Badge bg="success">{approvedRatings.length}</Badge>
                </span>
              }
            >
              {approvedRatings.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">Onaylanmış değerlendirme bulunmuyor.</p>
                </div>
              ) : (
                <RatingsTable 
                  ratings={approvedRatings}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleOpenDeleteModal}
                  approveLoading={approveLoading}
                  showApproveButton={false}
                  showRejectButton={true}
                />
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Silme Onay Modalı */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ color: colors.danger }}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Değerlendirmeyi Sil
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRating && (
            <p>
              <span className="fw-bold">{selectedRating.userFullName}</span> tarafından yapılan,{' '}
              <span className="fw-bold">{selectedRating.serviceTitle}</span> hizmetine ait değerlendirmeyi silmek istediğinize emin misiniz?
              Bu işlem geri alınamaz.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
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
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Değerlendirmeyi Sil
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Rating tablosu bileşeni
interface RatingsTableProps {
  ratings: Rating[];
  onApprove: (rating: Rating) => void;
  onReject: (rating: Rating) => void;
  onDelete: (rating: Rating) => void;
  approveLoading: boolean;
  showApproveButton: boolean;
  showRejectButton: boolean;
}

const RatingsTable: React.FC<RatingsTableProps> = ({ 
  ratings, 
  onApprove, 
  onReject, 
  onDelete,
  approveLoading,
  showApproveButton,
  showRejectButton
}) => {
  // Yıldız gösterim bileşeni
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div>
        {rating === 0 ? (
          <span className="text-muted">Değerlendirilmemiş</span>
        ) : (
          [...Array(5)].map((_, i) => (
            <FontAwesomeIcon 
              key={i} 
              icon={faStar} 
              style={{ 
                color: i < rating ? '#ffc107' : '#e4e5e9',
                marginRight: '2px'
              }} 
            />
          ))
        )}
      </div>
    );
  };

  return (
    <Table responsive hover>
      <thead>
        <tr>
          <th>#ID</th>
          <th>Kullanıcı</th>
          <th>Hizmet</th>
          <th>Değerlendirme</th>
          <th>Yorum</th>
          <th>Tarih</th>
          <th>İşlemler</th>
        </tr>
      </thead>
      <tbody>
        {ratings.map((rating) => (
          <tr key={rating.id}>
            <td>{rating.id}</td>
            <td>{rating.userFullName}</td>
            <td>{rating.serviceTitle}</td>
            <td>
              <StarRating rating={rating.rating} />
            </td>
            <td>
              {rating.comment 
                ? (rating.comment.length > 30 
                    ? `${rating.comment.substring(0, 30)}...` 
                    : rating.comment)
                : <span className="text-muted">Yorum yok</span>}
            </td>
            <td>{formatDate(rating.createdAt)}</td>
            <td>
              {showApproveButton && (
                <Button 
                  variant="outline-success" 
                  size="sm"
                  className="me-2"
                  onClick={() => onApprove(rating)}
                  disabled={approveLoading}
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                </Button>
              )}
              {showRejectButton && (
                <Button 
                  variant="outline-warning" 
                  size="sm"
                  className="me-2"
                  onClick={() => onReject(rating)}
                  disabled={approveLoading}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              )}
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => onDelete(rating)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default RatingsPage; 