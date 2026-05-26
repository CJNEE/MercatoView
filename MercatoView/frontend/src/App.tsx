import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { Layout } from './components/Layout';

// Pages
import { Discover } from './pages/Discover';
import { MapPage } from './pages/MapPage';
import { Trending } from './pages/Trending';
import { StallDetail } from './pages/StallDetail';
import { LoginRegister } from './pages/LoginRegister';
import { QRScannerPage } from './pages/QRScannerPage';
import { SavedStalls } from './pages/SavedStalls';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfileSettings } from './pages/ProfileSettings';
import { SellerDashboard } from './pages/SellerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

// Role-Based Protected Route Guard
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'SELLER' | 'CUSTOMER')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
        <p className="text-sm font-semibold tracking-wider animate-pulse">Checking credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Verify current user authentication state on mount
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Discovery Routes */}
          <Route path="/" element={<Discover />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/stalls/:id" element={<StallDetail />} />
          
          {/* Authentication */}
          <Route path="/login" element={<LoginRegister />} />

          {/* Customer Space (Protected) */}
          <Route 
            path="/qr-scanner" 
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'SELLER', 'ADMIN']}>
                <QRScannerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/saved-stalls" 
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <SavedStalls />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } 
          />

          {/* Seller Space (Protected) */}
          <Route 
            path="/seller" 
            element={
              <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Admin Space (Protected) */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
