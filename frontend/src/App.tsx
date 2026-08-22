import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { ClientLayout } from './layouts/ClientLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Client Pages
import { HomePage } from './pages/client/HomePage';
import { LoginPage } from './pages/client/LoginPage';
import { RegisterPage } from './pages/client/RegisterPage';
import { BookingPage } from './pages/client/BookingPage';
import { ProfileLoyaltyPage } from './pages/client/ProfileLoyaltyPage';
import { MyAppointmentsPage } from './pages/client/MyAppointmentsPage';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { CalendarPage } from './pages/admin/CalendarPage';
import { CustomersLoyaltyPage } from './pages/admin/CustomersLoyaltyPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { ServicesPage } from './pages/admin/ServicesPage';
import { StaffPage } from './pages/admin/StaffPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="reservar" element={<BookingPage />} />
          </Route>

          {/* Portal de Cliente Protegido */}
          <Route path="/mi-cuenta" element={<ClientLayout />}>
            <Route index element={<ProfileLoyaltyPage />} />
            <Route path="citas" element={<MyAppointmentsPage />} />
          </Route>

          {/* Portal Administrativo Protegido (Admin / Staff) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="agenda" element={<CalendarPage />} />
            <Route path="clientes" element={<CustomersLoyaltyPage />} />
            <Route path="ventas" element={<ProductsPage />} />
            
            {/* Rutas exclusivas de Admin (Se controlan internamente también) */}
            <Route path="servicios" element={<ServicesPage />} />
            <Route path="estilistas" element={<StaffPage />} />
            <Route path="productos" element={<ProductsPage />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
