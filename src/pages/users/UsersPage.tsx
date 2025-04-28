import React, { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, Button, Spinner, Alert, Row, Col, Form, InputGroup, Tooltip, OverlayTrigger } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserShield, 
  faUserPlus, 
  faEnvelopeCircleCheck, 
  faSearch, 
  faFilter, 
  faSyncAlt,
  faUserClock,
  faEnvelope,
  faPhone,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  isEmailConfirmed: boolean;
  isAdmin: boolean;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Yeşil renk paleti - anasayfadakiyle aynı
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
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.isSuccess && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Beklenmeyen API yanıt formatı:', response.data);
        setError('Kullanıcı verileri beklenmeyen formatta.');
        setUsers([]);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata oluştu:', error);
      setError('Kullanıcılar yüklenirken bir hata oluştu.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    // Arama filtreleme
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(term) || 
        user.lastName.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        (user.phoneNumber && user.phoneNumber.includes(term))
      );
    }
    
    // Durum filtreleme
    if (statusFilter !== 'all') {
      const isConfirmed = statusFilter === 'confirmed';
      filtered = filtered.filter(user => user.isEmailConfirmed === isConfirmed);
    }
    
    // Rol filtreleme
    if (roleFilter !== 'all') {
      const isAdmin = roleFilter === 'admin';
      filtered = filtered.filter(user => user.isAdmin === isAdmin);
    }
    
    setFilteredUsers(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Kullanıcı istatistiklerini hesapla
  const getUsersStats = () => {
    return {
      total: users.length,
      admins: users.filter(u => u.isAdmin).length,
      confirmed: users.filter(u => u.isEmailConfirmed).length,
      pending: users.filter(u => !u.isEmailConfirmed).length,
      lastWeek: users.filter(u => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(u.createdAt) >= oneWeekAgo;
      }).length
    };
  };

  // Tooltip özelleştirme fonksiyonu
  const renderTooltip = (props: any) => (
    <Tooltip id="button-tooltip" {...props}>
      Yakında Eklenecek!
    </Tooltip>
  );

  const stats = getUsersStats();

  if (loading && users.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: colors.primary }} />
        <p className="mt-2">Kullanıcılar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: colors.primary, fontWeight: 'bold' }}>Kullanıcı Yönetimi</h2>
        <Button 
          variant="outline-success" 
          onClick={fetchUsers}
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          <FontAwesomeIcon icon={faSyncAlt} className="me-2" />
          Yenile
        </Button>
      </div>
      
      {/* İstatistik Kartları */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.primary}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Toplam Kullanıcı</p>
                  <h3 className="fw-bold mb-0">{stats.total}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: colors.light }}>
                  <FontAwesomeIcon icon={faUsers} size="lg" style={{ color: colors.primary }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.danger}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Admin Sayısı</p>
                  <h3 className="fw-bold mb-0">{stats.admins}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#f8d7da' }}>
                  <FontAwesomeIcon icon={faUserShield} size="lg" style={{ color: colors.danger }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.success}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Onaylı Kullanıcı</p>
                  <h3 className="fw-bold mb-0">{stats.confirmed}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#d1e7dd' }}>
                  <FontAwesomeIcon icon={faEnvelopeCircleCheck} size="lg" style={{ color: colors.success }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body style={{ borderLeft: `4px solid ${colors.warning}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Yeni Kullanıcı (7g)</p>
                  <h3 className="fw-bold mb-0">{stats.lastWeek}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#fff3cd' }}>
                  <FontAwesomeIcon icon={faUserPlus} size="lg" style={{ color: colors.warning }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Filtreleme Satırı */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ color: colors.primary }} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="İsim, e-posta veya telefon ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #ced4da' }}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="mt-3 mt-md-0">
              <InputGroup>
                <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ color: colors.primary }} />
                </InputGroup.Text>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #ced4da' }}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="confirmed">Onaylı</option>
                  <option value="pending">Onay Bekliyor</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3} className="mt-3 mt-md-0">
              <InputGroup>
                <InputGroup.Text style={{ backgroundColor: colors.light, border: 'none' }}>
                  <FontAwesomeIcon icon={faUserShield} style={{ color: colors.primary }} />
                </InputGroup.Text>
                <Form.Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #ced4da' }}
                >
                  <option value="all">Tüm Roller</option>
                  <option value="admin">Admin</option>
                  <option value="user">Kullanıcı</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={1} className="d-flex align-items-center justify-content-end mt-3 mt-md-0">
              <Badge bg="secondary" className="py-2 px-3">
                {filteredUsers.length} Kullanıcı
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Kullanıcı Tablosu */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead style={{ backgroundColor: colors.light }}>
              <tr>
                <th className="ps-4">ID</th>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Durum</th>
                <th>Rol</th>
                <th>Kayıt Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <Spinner animation="border" size="sm" style={{ color: colors.primary }} />
                    <span className="ms-2">Kullanıcılar yükleniyor...</span>
                  </td>
                </tr>
              )}
              
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <FontAwesomeIcon icon={faUsers} className="me-2" style={{ color: colors.primary }} />
                    Aranan kriterlere uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
              
              {!loading && filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="ps-4">{user.id}</td>
                  <td className="fw-medium">{user.firstName} {user.lastName}</td>
                  <td>
                    <FontAwesomeIcon icon={faEnvelope} className="me-2 text-muted" />
                    {user.email}
                  </td>
                  <td>
                    {user.phoneNumber ? (
                      <>
                        <FontAwesomeIcon icon={faPhone} className="me-2 text-muted" />
                        {user.phoneNumber}
                      </>
                    ) : '-'}
                  </td>
                  <td>
                    <Badge 
                      bg={user.isEmailConfirmed ? 'success' : 'warning'} 
                      className="rounded-pill py-1 px-2"
                    >
                      {user.isEmailConfirmed ? 'Onaylı' : 'Onay Bekliyor'}
                    </Badge>
                  </td>
                  <td>
                    <Badge 
                      bg={user.isAdmin ? 'danger' : 'primary'} 
                      className="rounded-pill py-1 px-2"
                      style={{ backgroundColor: user.isAdmin ? colors.danger : colors.primary }}
                    >
                      {user.isAdmin ? 'Admin' : 'Kullanıcı'}
                    </Badge>
                  </td>
                  <td>
                    <FontAwesomeIcon icon={faUserClock} className="me-2 text-muted" />
                    {formatDate(user.createdAt)}
                  </td>
                  <td>
                    <OverlayTrigger
                      placement="top"
                      delay={{ show: 250, hide: 400 }}
                      overlay={renderTooltip}
                    >
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="rounded-pill"
                      >
                        <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                        Görüntüle
                      </Button>
                    </OverlayTrigger>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UsersPage; 