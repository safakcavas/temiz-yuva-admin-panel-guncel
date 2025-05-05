import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import ServicesPage from './pages/services/ServicesPage';
import ServiceFormPage from './pages/services/ServiceFormPage';
import ReservationsPage from './pages/reservations/ReservationsPage';
import ReservationDetailPage from './pages/reservations/ReservationDetailPage';
import ContactFormsPage from './pages/contact/ContactFormsPage';
import ContactFormDetailPage from './pages/contact/ContactFormDetailPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import RatingsPage from './pages/ratings/RatingsPage';
import BlogPage from './pages/blog/BlogPage';

// Auth Provider
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="services/new" element={<ServiceFormPage />} />
            <Route path="services/:id/edit" element={<ServiceFormPage />} />
            <Route path="services/edit/:id" element={<ServiceFormPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="reservations/:id" element={<ReservationDetailPage />} />
            <Route path="reservations/:id/edit" element={<ReservationDetailPage />} />
            <Route path="contact-forms" element={<ContactFormsPage />} />
            <Route path="contact-forms/:id" element={<ContactFormDetailPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="ratings" element={<RatingsPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
