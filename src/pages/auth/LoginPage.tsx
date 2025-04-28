import React, { useState } from 'react';
import { Form, Button, Card, Alert, Spinner, Container, Row, Col, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Yeşil renk paleti
  const colors = {
    primary: '#0a6c3c',
    secondary: '#174',
    light: '#e8f5e9',
    dark: 'hsl(150,83%,23%)'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Giriş bilgileri hatalı. Lütfen e-posta ve şifrenizi kontrol edin.');
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center" 
         style={{ 
           background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
         }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="overflow-hidden border-0 shadow-lg rounded-4">
              <div className="text-white text-center py-4" 
                  style={{ 
                     backgroundColor: colors.primary,
                  }}>
                <div className="d-flex justify-content-center align-items-center">
                  <div 
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '5px',
                      marginRight: '10px'
                    }}
                  >
                    <Image 
                      src="https://www.temizyuva.com/logo1.svg" 
                      alt="Temiz Yuva" 
                      width="45"
                      height="45"
                    />
                  </div>
                  <h2 className="fw-bold mb-0">Admin Panel</h2>
                </div>
              </div>
              <Card.Body className="p-4 p-sm-5" style={{ backgroundColor: colors.light }}>
                <div className="text-center mb-4">
                  <h4 className="mb-3" style={{ color: colors.dark }}>Hoş Geldiniz</h4>
                  <p className="text-muted">Lütfen hesabınızla giriş yapın</p>
                </div>
                
                {error && (
                  <Alert variant="danger" className="mb-3 rounded-3 border-0">
                    {error}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4 form-floating">
                    <Form.Control
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ornek@email.com"
                      className="rounded-3"
                    />
                    <Form.Label htmlFor="email">E-posta</Form.Label>
                  </Form.Group>

                  <Form.Group className="mb-4 form-floating">
                    <Form.Control
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Şifrenizi girin"
                      className="rounded-3"
                    />
                    <Form.Label htmlFor="password">Şifre</Form.Label>
                  </Form.Group>

                  <div className="mb-4">
                    <Form.Check 
                      type="checkbox" 
                      id="rememberMe" 
                      label="Beni hatırla" 
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-100 py-2 rounded-pill fw-bold"
                    disabled={loading}
                    style={{ 
                      backgroundColor: colors.primary, 
                      borderColor: colors.primary,
                      color: 'white'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">Giriş yapılıyor...</span>
                      </>
                    ) : (
                      'Giriş Yap'
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
            <div className="text-center text-white mt-3">
              <p>© {new Date().getFullYear()} Temiz Yuva. Tüm hakları saklıdır.</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage; 