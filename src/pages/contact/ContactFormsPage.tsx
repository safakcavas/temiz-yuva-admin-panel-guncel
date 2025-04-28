import React, { useState, useEffect } from 'react';
import { Table, Badge, Card, Spinner, Alert, Row, Col, Form, InputGroup, Button, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ContactForm } from '../../types/ContactForm';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faEnvelopeOpen, 
  faSearch, 
  faFilter, 
  faSync, 
  faEye, 
  faSortAmountDown, 
  faSortAmountUp,
  faCalendarAlt,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import './ContactFormsPage.css';

const ContactFormsPage: React.FC = () => {
  const [contactForms, setContactForms] = useState<ContactForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchContactForms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [contactForms, searchTerm, statusFilter, sortOrder]);

  const fetchContactForms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/contactform`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API Yanıtı:', response.data);

      if (response.data.success) {
        setContactForms(response.data.data);
      } else {
        setError(response.data.message || 'Veriler alınamadı');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'İletişim formları yüklenirken bir hata oluştu');
      console.error('Error fetching contact forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...contactForms];
    
    // Arama filtresi
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(form => 
        form.fullName.toLowerCase().includes(term) ||
        form.email.toLowerCase().includes(term) ||
        form.phone.includes(term) ||
        form.subject.toLowerCase().includes(term)
      );
    }
    
    // Durum filtresi
    if (statusFilter !== null) {
      filtered = filtered.filter(form => form.isRead === statusFilter);
    }
    
    // Sıralama
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredForms(filtered);
  };

  const handleRowClick = (id: number) => {
    navigate(`/contact-forms/${id}`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter(null);
    setSortOrder('desc');
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: tr });
  };

  if (loading && contactForms.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">İletişim formları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="contact-forms-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">
          <FontAwesomeIcon icon={faEnvelope} className="me-2" />
          İletişim Formları
        </h2>
        <Button 
          variant="primary" 
          onClick={fetchContactForms}
        >
          <FontAwesomeIcon icon={faSync} className="me-2" />
          Yenile
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      <Card className="filter-card mb-4 shadow-sm border-0">
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Ad, email veya telefon ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 border-bottom"
                />
              </InputGroup>
            </Col>
            <Col md={8}>
              <div className="d-flex gap-2 justify-content-md-end">
                <Dropdown>
                  <Dropdown.Toggle variant="light" id="status-filter" className="filter-dropdown">
                    <FontAwesomeIcon icon={faFilter} className="me-2" />
                    {statusFilter === null ? 'Tüm Durumlar' : 
                      statusFilter ? 'Okunmuş' : 'Okunmamış'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item active={statusFilter === null} onClick={() => setStatusFilter(null)}>
                      Tüm Durumlar
                    </Dropdown.Item>
                    <Dropdown.Item active={statusFilter === false} onClick={() => setStatusFilter(false)}>
                      <FontAwesomeIcon icon={faTimes} className="me-2 text-warning" />
                      Okunmamış
                    </Dropdown.Item>
                    <Dropdown.Item active={statusFilter === true} onClick={() => setStatusFilter(true)}>
                      <FontAwesomeIcon icon={faCheck} className="me-2 text-success" />
                      Okunmuş
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                
                <Button variant="light" onClick={toggleSortOrder} className="filter-button">
                  <FontAwesomeIcon 
                    icon={sortOrder === 'asc' ? faSortAmountUp : faSortAmountDown} 
                    className="me-2" 
                  />
                  {sortOrder === 'asc' ? 'Eskiden Yeniye' : 'Yeniden Eskiye'}
                </Button>
                
                {(searchTerm || statusFilter !== null) && (
                  <Button variant="outline-secondary" onClick={resetFilters} size="sm" className="filter-clear-button">
                    Filtreleri Temizle
                  </Button>
                )}
              </div>
            </Col>
          </Row>
          
          <div className="mt-3">
            <Badge bg="primary" className="results-badge">
              {filteredForms.length} İletişim Formu Bulundu
            </Badge>
            {statusFilter !== null && (
              <Badge bg={statusFilter ? "success" : "warning"} className="ms-2 status-filter-badge">
                {statusFilter ? "Okunmuş" : "Okunmamış"}
              </Badge>
            )}
          </div>
        </Card.Body>
      </Card>

      <Card className="data-card shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="contact-forms-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>ID</th>
                  <th style={{ width: '15%' }}>Ad Soyad</th>
                  <th style={{ width: '15%' }}>E-posta</th>
                  <th style={{ width: '10%' }}>Telefon</th>
                  <th style={{ width: '25%' }}>Konu</th>
                  <th style={{ width: '10%' }}>Durum</th>
                  <th style={{ width: '15%' }}>Tarih</th>
                  <th style={{ width: '5%' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.length > 0 ? (
                  filteredForms.map((form) => (
                    <tr 
                      key={form.id} 
                      onClick={() => handleRowClick(form.id)}
                      style={{ cursor: 'pointer' }}
                      className={!form.isRead ? 'table-light-hover unread-row' : ''}
                    >
                      <td>#{form.id}</td>
                      <td>
                        <span className="fw-bold">{form.fullName}</span>
                      </td>
                      <td>
                        <span className="text-muted">{form.email}</span>
                      </td>
                      <td>{form.phone}</td>
                      <td>
                        <div className="subject-text">
                          {form.subject}
                        </div>
                      </td>
                      <td>{getStatusBadge(form.isRead)}</td>
                      <td>
                        <div className="d-flex align-items-center text-muted small">
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                          {formatDateTime(form.createdAt)}
                        </div>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(form.id);
                          }}
                          className="action-button"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <FontAwesomeIcon icon={faFilter} className="mb-3 text-muted" size="2x" />
                      <p>Filtrelere uygun iletişim formu bulunamadı.</p>
                      <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
                        Filtreleri Temizle
                      </Button>
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

export default ContactFormsPage; 