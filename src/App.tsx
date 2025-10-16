import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import EmployeesPage from './pages/employees/EmployeesPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductDetailsPage from './pages/products/ProductDetailsPage';
import PricesPage from './pages/products/PricesPage';
import WarehousesPage from './pages/products/WarehousesPage';
import SyncPage from './pages/products/SyncPage';
import ImagesPage from './pages/products/ImagesPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailsPage from './pages/orders/OrderDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import ClientsPage from './pages/ClientsPage';
import ClientOrdersPage from './pages/orders/ClientOrdersPage';

function App() {
  const { user } = useAuth();
  useEffect(() => {
    document.title = 'Тройка - Панель управления';
  }, []);

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} /> // при обновлении срабатывает
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        {/* Сотрудники (только для админа) */}
        <Route path="/employees" element={
          <ProtectedRoute requiresAdmin>
            <EmployeesPage />
          </ProtectedRoute>
        } />
        {/* Товары */}
        <Route path="/products" element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        } />
        <Route path="/products/:id" element={
          <ProtectedRoute>
            <ProductDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/products/prices" element={
          <ProtectedRoute>
            <PricesPage />
          </ProtectedRoute>
        } />
        <Route path="/products/warehouses" element={
          <ProtectedRoute>
            <WarehousesPage />
          </ProtectedRoute>
        } />
        <Route path="/products/sync" element={
          <ProtectedRoute requiresModerator>
            <SyncPage />
          </ProtectedRoute>
        } />
        <Route path="/products/images" element={
          <ProtectedRoute requiresModerator>
            <ImagesPage />
          </ProtectedRoute>
        } />
        
        {/* Заказы */}
        <Route path="/orders" element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/orders/:orderId" element={
          <ProtectedRoute>
            <OrderDetailsPage />
          </ProtectedRoute>
        } />
         {/* Менеджмент клиентов и их заказов*/}
        <Route path="/client/:clientId/orders" element={
          <ProtectedRoute>
            <ClientOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/client" element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;