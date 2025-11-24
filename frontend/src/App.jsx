import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Movements from './pages/Movements';
import MovementForm from './pages/MovementForm';
import MovementDetail from './pages/MovementDetail';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="movements" element={<Movements />} />
          <Route path="movements/new" element={<MovementForm />} />
          <Route path="movements/:id" element={<MovementDetail />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;

