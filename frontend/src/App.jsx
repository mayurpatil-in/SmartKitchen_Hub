import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import ProtectedRoute from './components/ProtectedRoute';
import ToastNotifications from './components/ToastNotifications';
import MainLayout from './layouts/MainLayout';

// Pages Catalog
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Quotations from './pages/Quotations';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Services from './pages/Services';

function App() {
  return (
    <Provider store={store}>
      <Router>
        {/* Toast alerts system rendering */}
        <ToastNotifications />
        
        <Routes>
          {/* Public Authentication Screen */}
          <Route path="/login" element={<Login />} />

          {/* Gated Admin/Sales/Tech/Customer Workspace Routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Manager"]}>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute>
              <MainLayout>
                <Products />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Manager", "Technician"]}>
              <MainLayout>
                <Customers />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/quotations" element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Manager", "Customer"]}>
              <MainLayout>
                <Quotations />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute>
              <MainLayout>
                <Orders />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Manager"]}>
              <MainLayout>
                <Inventory />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/services" element={
            <ProtectedRoute>
              <MainLayout>
                <Services />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all fallback redirecting back to home/dashboard */}
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
