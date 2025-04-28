import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Token'ın geçerli olup olmadığını kontrol eden fonksiyon
  const isTokenValid = (token: string | null) => {
    if (!token) return false;
    
    try {
      // JWT token yapısı: header.payload.signature
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      
      // Token süresinin dolup dolmadığını kontrol et
      const expirationTime = decodedPayload.exp * 1000; // milisaniyeye çevir
      return Date.now() < expirationTime;
    } catch (error) {
      console.error('Token çözümlenirken hata oluştu:', error);
      return false;
    }
  };

  // Token yenileme fonksiyonu
  const refreshToken = async (token: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/Auth/refresh-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        return response.data.token;
      }
      return null;
    } catch (error) {
      console.error('Token yenilenirken hata oluştu:', error);
      return null;
    }
  };

  // Token kontrol ve gerekirse yenileme işlemi
  const checkAndRefreshToken = async () => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setLoading(false);
      return null;
    }
    
    if (isTokenValid(storedToken)) {
      setToken(storedToken);
      setIsAuthenticated(true);
      return storedToken;
    } else {
      // Token geçersiz - yenilemeyi dene
      const newToken = await refreshToken(storedToken);
      
      if (newToken) {
        setToken(newToken);
        setIsAuthenticated(true);
        return newToken;
      } else {
        // Yenileme başarısız - kullanıcıyı çıkış yaptır
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        return null;
      }
    }
  };

  // Kullanıcı oturum bilgilerini yükle
  const loadUserSession = async () => {
    const validToken = await checkAndRefreshToken();
    
    if (!validToken) {
      setLoading(false);
      return;
    }
    
    try {
      // Token varsa kullanıcı bilgilerini al
      const response = await axios.get(`${API_BASE_URL}/Auth/profile`, {
        headers: {
          Authorization: `Bearer ${validToken}`
        }
      });
      
      if (response.data) {
        setUser({
          id: response.data.id,
          fullName: response.data.fullName,
          email: response.data.email,
          role: response.data.role
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınırken hata oluştu:', error);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserSession();

    // Her 15 dakikada bir token kontrolü/yenileme
    const tokenCheckInterval = setInterval(() => {
      checkAndRefreshToken();
    }, 15 * 60 * 1000); // 15 dakika
    
    return () => clearInterval(tokenCheckInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Axios interceptor'ı ekle - her istekte token kontrolü
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      async (config) => {
        // İstek gönderilmeden önce token geçerliliğini kontrol et
        const currentToken = localStorage.getItem('token');
        
        if (currentToken && !isTokenValid(currentToken)) {
          const refreshedToken = await refreshToken(currentToken);
          
          if (refreshedToken) {
            config.headers.Authorization = `Bearer ${refreshedToken}`;
          } else {
            // Token yenilenemedi, kullanıcıyı çıkış yaptır
            logout();
          }
        } else if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
        email,
        password
      });

      // API yanıt yapısını kontrol et
      console.log('Login API yanıtı:', response.data);

      // isSuccess kontrolü
      if (response.data.isSuccess) {
        const responseData = response.data.data || response.data;
        const token = responseData.token || response.data.token;
        const userData = responseData.user || response.data.user || {};

        if (!token) {
          throw new Error('Token bulunamadı');
        }

        localStorage.setItem('token', token);
        setToken(token);

        // Kullanıcı bilgileri içindeki alanları kontrol et
        const userToSet = {
          id: userData.id || 0,
          fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email || email,
          role: userData.role || 'User'
        };

        setUser(userToSet);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      } else {
        throw new Error(response.data.message || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('Login hatası:', error);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 