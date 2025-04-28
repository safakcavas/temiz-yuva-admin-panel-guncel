import React from 'react';
import { Container, Navbar, Nav, Button, Image, Badge } from 'react-bootstrap';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Ana renk ve koyu versiyonu
  const brandColor = '#0a6c3c';
  const darkBrandColor = '#085330';

  // Aktif menü öğesi kontrolü
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar 
        style={{ backgroundColor: darkBrandColor }} 
        variant="dark" 
        expand="lg" 
        className="py-2"
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <Image 
              src="https://www.temizyuva.com/logo1.svg" 
              alt="Logo" 
              height="40" 
              className="me-2" 
              style={{
                borderRadius: '50%',
                padding: '0',
                background: 'transparent',
                filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.4))'
              }} 
            />
            <span className="fw-bold">Temiz Yuva Admin Paneli</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/users" 
                className="fw-semibold mx-1" 
                style={{
                  backgroundColor: isActive('/users') ? brandColor : 'transparent',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              >
                Kullanıcılar
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/services" 
                className="fw-semibold mx-1"
                style={{
                  backgroundColor: isActive('/services') ? brandColor : 'transparent',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              >
                Hizmetler
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/reservations" 
                className="fw-semibold mx-1"
                style={{
                  backgroundColor: isActive('/reservations') ? brandColor : 'transparent',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              >
                Rezervasyonlar
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/contact-forms" 
                className="fw-semibold mx-1"
                style={{
                  backgroundColor: isActive('/contact-forms') ? brandColor : 'transparent',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              >
                İletişim Formları
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/notifications" 
                className="fw-semibold mx-1"
                style={{
                  backgroundColor: isActive('/notifications') ? brandColor : 'transparent',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              >
                Bildirimler
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/ratings" 
                className="fw-semibold mx-1"
                style={{
                  backgroundColor: isActive('/ratings') ? brandColor : 'transparent',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              >
                Değerlendirmeler
              </Nav.Link>
            </Nav>
            <Nav>
              <Navbar.Text className="me-3 fw-semibold text-white">
                {user?.fullName}
              </Navbar.Text>
              <Button 
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  border: '2px solid white',
                  borderRadius: '30px',
                  padding: '6px 16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
                className="d-flex align-items-center"
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = darkBrandColor;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'white';
                }}
              >
                <span className="mx-1">Çıkış Yap</span>
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="flex-grow-1 py-4">
        <Outlet />
      </Container>

      <footer style={{ backgroundColor: darkBrandColor }} className="text-white py-3">
        <Container>
          <p className="text-center mb-0">© 2024 Temiz Yuva Admin Paneli <span className="ms-2 badge bg-light text-dark">v0.79</span></p>
        </Container>
      </footer>
    </div>
  );
};

export default AdminLayout; 