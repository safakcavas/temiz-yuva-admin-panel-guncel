import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, ProgressBar, Badge } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarCheck, 
  faHourglassHalf, 
  faCheckCircle, 
  faTimesCircle,
  faMoneyBillWave,
  faCreditCard,
  faWrench,
  faUsers,
  faUserPlus,
  faChartLine,
  faArrowUp,
  faArrowDown,
  faStar,
  faComment,
  faQuoteLeft
} from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Rating } from '../../types/Rating';

// Ana dashboard verisi interface'i
interface DashboardData {
  totalReservations: number;
  pendingReservations: number;
  completedReservations: number;
  canceledReservations: number;
  recentReservations: number;
  totalRevenue: number;
  pendingPayments: number;
  activeServices: number;
  totalUsers: number;
  newUsers: number;
}

// Aylık dashboard verisi interface'i
interface MonthlyData {
  currentMonth: {
    month: string;
    expectedRevenue: number;
    actualRevenue: number;
    totalReservations: number;
    completedReservations: number;
    canceledReservations: number;
    completionRate: number;
  };
  lastMonth: {
    month: string;
    revenue: number;
    totalReservations: number;
    completedReservations: number;
    completionRate: number;
  };
  changes: {
    revenueChange: number;
    reservationChange: number;
    completionRateChange: number;
  };
}

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalReservations: 0,
    pendingReservations: 0,
    completedReservations: 0,
    canceledReservations: 0,
    recentReservations: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeServices: 0,
    totalUsers: 0,
    newUsers: 0
  });
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);

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
    fetchDashboardData();
    fetchMonthlyData();
    fetchRatings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.isSuccess) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Dashboard verisi alınırken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMonthlyData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/admin/monthly-dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.isSuccess) {
        setMonthlyData(response.data.data);
      }
    } catch (error) {
      console.error('Aylık dashboard verisi alınırken hata oluştu:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      setRatingsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Sadece onaylanmış değerlendirmeleri filtrele
        const approvedRatings = response.data.data.filter((r: any) => r.isApproved);
        setRatings(approvedRatings);
      }
    } catch (error) {
      console.error('Müşteri yorumları alınırken hata oluştu:', error);
    } finally {
      setRatingsLoading(false);
    }
  };

  // Para formatı
  const formatPrice = (price: number) => {
    return price.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺';
  };
  
  // Yüzde formatı
  const formatPercent = (percent: number) => {
    // Yüzde değerlerini tam sayıya yuvarlayarak göster (66.666... -> 67%)
    return Math.round(percent) + '%';
  };
  
  // Değişim yüzdesi için oklar
  const renderChangeIndicator = (value: number, inverse: boolean = false) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const color = isPositive ? colors.success : (value === 0 ? colors.info : colors.danger);
    const icon = isPositive ? faArrowUp : faArrowDown;
    
    return value === 0 ? null : (
      <Badge 
        pill 
        className="ms-2" 
        style={{ backgroundColor: color }}
      >
        <FontAwesomeIcon icon={icon} className="me-1" />
        {Math.round(Math.abs(value))}%
      </Badge>
    );
  };
  
  // Reservation chart verisi
  const getReservationChartData = () => {
    if (!monthlyData) return [];
    
    return [
      {
        name: 'Geçen Ay',
        Toplam: monthlyData.lastMonth.totalReservations,
        Tamamlanan: monthlyData.lastMonth.completedReservations
      },
      {
        name: 'Bu Ay',
        Toplam: monthlyData.currentMonth.totalReservations,
        Tamamlanan: monthlyData.currentMonth.completedReservations,
        İptal: monthlyData.currentMonth.canceledReservations
      }
    ];
  };

  if (loading && !dashboardData) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: colors.primary }} />
        <p className="mt-2">Dashboard yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: colors.primary, fontWeight: 'bold' }}>Dashboard</h2>
        <div>
          <Badge style={{ backgroundColor: colors.primary }}>Güncel Veriler</Badge>
        </div>
      </div>
      
      {/* Ana İstatistikler */}
      <Row>
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body style={{ borderLeft: `4px solid ${colors.primary}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Toplam Rezervasyon</p>
                  <h3 className="fw-bold mb-0">{dashboardData.totalReservations}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: `${colors.light}` }}>
                  <FontAwesomeIcon icon={faCalendarCheck} size="lg" style={{ color: colors.primary }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body style={{ borderLeft: `4px solid ${colors.warning}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Bekleyen Rezervasyon</p>
                  <h3 className="fw-bold mb-0">{dashboardData.pendingReservations}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#fff3cd' }}>
                  <FontAwesomeIcon icon={faHourglassHalf} size="lg" style={{ color: colors.warning }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body style={{ borderLeft: `4px solid ${colors.success}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Tamamlanan</p>
                  <h3 className="fw-bold mb-0">{dashboardData.completedReservations}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#d1e7dd' }}>
                  <FontAwesomeIcon icon={faCheckCircle} size="lg" style={{ color: colors.success }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body style={{ borderLeft: `4px solid ${colors.danger}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">İptal Edilen</p>
                  <h3 className="fw-bold mb-0">{dashboardData.canceledReservations}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#f8d7da' }}>
                  <FontAwesomeIcon icon={faTimesCircle} size="lg" style={{ color: colors.danger }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Aylık Özet */}
      {monthlyData && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0">
            <h5 className="mb-0" style={{ color: colors.primary }}>Aylık Performans Özeti</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4} className="mb-3 mb-md-0">
                <Card className="h-100 border-0 bg-light">
                  <Card.Body>
                    <h6 className="text-muted">{monthlyData.currentMonth.month} - Gelir</h6>
                    <div className="d-flex align-items-baseline">
                      <h4 className="fw-bold mb-0">{formatPrice(monthlyData.currentMonth.actualRevenue)}</h4>
                      {renderChangeIndicator(monthlyData.changes.revenueChange)}
                    </div>
                    <p className="text-muted mb-2 small">Beklenen: {formatPrice(monthlyData.currentMonth.expectedRevenue)}</p>
                    <ProgressBar 
                      now={(monthlyData.currentMonth.actualRevenue / monthlyData.currentMonth.expectedRevenue) * 100} 
                      variant="success" 
                      style={{ height: '5px' }}
                    />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-3 mb-md-0">
                <Card className="h-100 border-0 bg-light">
                  <Card.Body>
                    <h6 className="text-muted">{monthlyData.currentMonth.month} - Rezervasyonlar</h6>
                    <div className="d-flex align-items-baseline">
                      <h4 className="fw-bold mb-0">{monthlyData.currentMonth.totalReservations}</h4>
                      {renderChangeIndicator(monthlyData.changes.reservationChange)}
                    </div>
                    <p className="text-muted mb-2 small">
                      Tamamlanan: {monthlyData.currentMonth.completedReservations} / 
                      İptal: {monthlyData.currentMonth.canceledReservations}
                    </p>
                    <ProgressBar style={{ height: '5px' }}>
                      <ProgressBar 
                        variant="success" 
                        now={(monthlyData.currentMonth.completedReservations / monthlyData.currentMonth.totalReservations) * 100} 
                        key={1} 
                      />
                      <ProgressBar 
                        variant="danger" 
                        now={(monthlyData.currentMonth.canceledReservations / monthlyData.currentMonth.totalReservations) * 100} 
                        key={2} 
                      />
                    </ProgressBar>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100 border-0 bg-light">
                  <Card.Body>
                    <h6 className="text-muted">{monthlyData.currentMonth.month} - Tamamlanma Oranı</h6>
                    <div className="d-flex align-items-baseline">
                      <h4 className="fw-bold mb-0">{formatPercent(monthlyData.currentMonth.completionRate)}</h4>
                      {renderChangeIndicator(monthlyData.changes.completionRateChange)}
                    </div>
                    <p className="text-muted mb-2 small">
                      Önceki ay: {formatPercent(monthlyData.lastMonth.completionRate)}
                    </p>
                    <ProgressBar 
                      now={monthlyData.currentMonth.completionRate} 
                      variant="primary" 
                      style={{ height: '5px', backgroundColor: '#d0d0d0' }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Grafikler */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0" style={{ color: colors.primary }}>Rezervasyon İstatistikleri</h5>
            </Card.Header>
            <Card.Body>
              {monthlyData && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getReservationChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Toplam" fill={colors.primary} />
                    <Bar dataKey="Tamamlanan" fill={colors.success} />
                    <Bar dataKey="İptal" fill={colors.danger} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Son Müşteri Yorumları ve Ortalama Puan */}
      <Row className="mb-4">
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0" style={{ color: colors.primary }}>Son Müşteri Yorumları</h5>
            </Card.Header>
            <Card.Body>
              {ratingsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" style={{ color: colors.primary }} />
                  <p className="mt-2">Yorumlar yükleniyor...</p>
                </div>
              ) : ratings.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">Henüz onaylanmış yorum bulunmuyor.</p>
                </div>
              ) : (
                <div>
                  {ratings.slice(0, 3).map((rating) => (
                    <div key={rating.id} className="p-3 mb-3 rounded bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h6 className="mb-0 fw-bold">{rating.userFullName}</h6>
                          <p className="text-muted small mb-0">{rating.serviceTitle}</p>
                        </div>
                        <div className="d-flex align-items-center">
                          {rating.rating === 0 ? (
                            <span className="text-muted small">Değerlendirilmemiş</span>
                          ) : (
                            [...Array(5)].map((_, i) => (
                              <FontAwesomeIcon 
                                key={i} 
                                icon={faStar} 
                                style={{ 
                                  color: i < rating.rating ? colors.warning : '#e4e5e9',
                                  marginLeft: '2px'
                                }} 
                              />
                            ))
                          )}
                          <span className="ms-2 text-muted small">
                            {new Date(rating.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 position-relative ps-3">
                        <FontAwesomeIcon 
                          icon={faQuoteLeft} 
                          style={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: 0,
                            opacity: 0.3
                          }} 
                        />
                        <p className="mb-0">{rating.comment || 'Yorum yapılmamış'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0" style={{ color: colors.primary }}>Ortalama Puanlama</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
              {ratingsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" style={{ color: colors.primary }} />
                </div>
              ) : ratings.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">Henüz onaylanmış puanlama bulunmuyor.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 position-relative">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        backgroundColor: colors.light,
                        border: `3px solid ${colors.primary}`
                      }}
                    >
                      <h1 className="mb-0 fw-bold" style={{ color: colors.primary }}>
                        {ratings.filter(r => r.rating > 0).length > 0 
                          ? (ratings.filter(r => r.rating > 0).reduce((sum, r) => sum + r.rating, 0) / ratings.filter(r => r.rating > 0).length).toFixed(1)
                          : '0.0'}
                      </h1>
                    </div>
                  </div>
                  <div className="d-flex justify-content-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon 
                        key={i} 
                        icon={faStar} 
                        style={{ 
                          color: i < Math.round(
                            ratings.filter(r => r.rating > 0).length > 0 
                              ? ratings.filter(r => r.rating > 0).reduce((sum, r) => sum + r.rating, 0) / ratings.filter(r => r.rating > 0).length
                              : 0
                          )
                            ? colors.warning 
                            : '#e4e5e9',
                          fontSize: '1.5rem',
                          marginLeft: '5px'
                        }} 
                      />
                    ))}
                  </div>
                  <p className="mb-0">Toplam {ratings.filter(r => r.rating > 0).length} müşteri değerlendirmesi</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Diğer İstatistikler */}
      <Row>
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body style={{ borderLeft: `4px solid ${colors.success}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Toplam Gelir</p>
                  <h3 className="fw-bold mb-0">{formatPrice(dashboardData.totalRevenue)}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#d1e7dd' }}>
                  <FontAwesomeIcon icon={faMoneyBillWave} size="lg" style={{ color: colors.success }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body style={{ borderLeft: `4px solid ${colors.warning}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Bekleyen Ödemeler</p>
                  <h3 className="fw-bold mb-0">{dashboardData.pendingPayments}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#fff3cd' }}>
                  <FontAwesomeIcon icon={faCreditCard} size="lg" style={{ color: colors.warning }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body style={{ borderLeft: `4px solid ${colors.info}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Aktif Hizmetler</p>
                  <h3 className="fw-bold mb-0">{dashboardData.activeServices}</h3>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: '#cff4fc' }}>
                  <FontAwesomeIcon icon={faWrench} size="lg" style={{ color: colors.info }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body style={{ borderLeft: `4px solid ${colors.primary}` }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Toplam Kullanıcı</p>
                  <h3 className="fw-bold mb-0">{dashboardData.totalUsers}</h3>
                  <span className="text-muted small">
                    Yeni: {dashboardData.newUsers}
                  </span>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: colors.light }}>
                  <FontAwesomeIcon icon={faUsers} size="lg" style={{ color: colors.primary }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage; 