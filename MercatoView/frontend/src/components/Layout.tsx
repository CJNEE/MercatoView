import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { 
  Compass, Map, Flame, Bell, User, QrCode, 
  BarChart3, ShieldAlert, LogOut, Menu, X, Heart
} from 'lucide-react';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch unread notifications
      api.get('notifications/').then((res) => {
        const unread = res.data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }).catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const navItems = [
    { label: 'Discover', path: '/', icon: Compass },
    { label: 'Market Map', path: '/map', icon: Map },
    { label: 'Trending', path: '/trending', icon: Flame },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0A0A] text-white">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 h-screen sticky top-0 px-4 py-6 justify-between shrink-0 z-30">
        <div className="space-y-8">
          {/* Logo & Tagline */}
          <div className="px-2" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-food-orange to-food-amber bg-clip-text text-transparent font-sans tracking-wide">
              MercatoView
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-sans italic">
              Helping Customers Discover the Best of Mercato Lucena
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active 
                      ? 'bg-gradient-to-r from-food-orange/20 to-food-amber/10 border-l-4 border-food-orange text-food-orange font-medium' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} className={active ? 'text-food-orange' : 'text-gray-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Specific Submenus */}
          {isAuthenticated && user && (
            <div className="pt-6 border-t border-white/5">
              <span className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                User Portal
              </span>
              <nav className="space-y-1">
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link
                      to="/saved-stalls"
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive('/saved-stalls') ? 'bg-white/5 text-white font-medium' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Heart size={18} />
                      <span>Favorites</span>
                    </Link>
                    <Link
                      to="/qr-scanner"
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive('/qr-scanner') ? 'bg-white/5 text-white font-medium' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <QrCode size={18} />
                      <span>Scan to Review</span>
                    </Link>
                  </>
                )}

                {user.role === 'SELLER' && (
                  <Link
                    to="/seller"
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/seller') ? 'bg-food-orange/10 text-food-orange border-l-4 border-food-orange font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 size={18} />
                    <span>Seller Hub</span>
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/admin') ? 'bg-red-500/10 text-red-400 border-l-4 border-red-500 font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <ShieldAlert size={18} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                
                <Link
                  to="/notifications"
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/notifications') ? 'bg-white/5 text-white font-medium' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Bell size={18} />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-food-orange text-black font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* Profile Card & Logout */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          {isAuthenticated && user ? (
            <div className="flex flex-col gap-3">
              <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-all">
                <div className="w-10 h-10 rounded-full bg-food-orange/20 border border-food-orange/30 flex items-center justify-center font-bold text-food-orange text-sm">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold truncate">{user.username}</p>
                  <p className="text-[10px] text-gray-500 font-mono capitalize">{user.role}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-2.5 w-full text-left text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" className="btn-primary py-2 text-center text-sm w-full block">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass-panel border-b border-white/5 sticky top-0 z-30">
        <Link to="/">
          <h1 className="text-xl font-bold bg-gradient-to-r from-food-orange to-food-amber bg-clip-text text-transparent">
            MercatoView
          </h1>
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuthenticated && unreadCount > 0 && (
            <Link to="/notifications" className="relative p-1 text-gray-400 hover:text-white">
              <Bell size={20} />
              <span className="absolute top-0 right-0 bg-food-orange text-black font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            </Link>
          )}
          
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-gray-400 hover:text-white"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* MOBILE FULL-SCREEN DROPDOWN MENU */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 top-16 bg-[#0A0A0A]/95 z-40 flex flex-col p-6 space-y-6">
          <nav className="flex flex-col gap-4 text-lg">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-3 rounded-xl flex items-center gap-3 ${
                  isActive(item.path) ? 'bg-food-orange/10 text-food-orange font-semibold' : 'text-gray-300'
                }`}
              >
                <item.icon size={22} />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {isAuthenticated && user && (
              <>
                <hr className="border-white/5 my-2" />
                {user.role === 'CUSTOMER' && (
                  <Link
                    to="/saved-stalls"
                    onClick={() => setShowMobileMenu(false)}
                    className="px-4 py-3 text-gray-300 flex items-center gap-3"
                  >
                    <Heart size={20} />
                    <span>Favorites</span>
                  </Link>
                )}
                {user.role === 'SELLER' && (
                  <Link
                    to="/seller"
                    onClick={() => setShowMobileMenu(false)}
                    className="px-4 py-3 text-food-orange flex items-center gap-3 font-semibold"
                  >
                    <BarChart3 size={20} />
                    <span>Seller Hub</span>
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className="px-4 py-3 text-red-400 flex items-center gap-3 font-semibold"
                  >
                    <ShieldAlert size={20} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className="px-4 py-3 text-gray-300 flex items-center gap-3"
                >
                  <User size={20} />
                  <span>Profile Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="px-4 py-3 text-red-400 text-left flex items-center gap-3"
                >
                  <LogOut size={20} />
                  <span>Log Out</span>
                </button>
              </>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setShowMobileMenu(false)}
                className="btn-primary py-3 text-center text-sm w-full block"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="flex-1 min-h-[calc(100vh-4rem)] md:h-screen md:overflow-y-auto pb-24 md:pb-6 px-6 py-6 z-10">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* 4. MOBILE BOTTOM TAB NAVIGATION (Google Maps/Food App Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/5 flex justify-around items-center h-16 px-4 z-30">
        <Link 
          to="/" 
          className={`flex flex-col items-center gap-1 ${
            isActive('/') ? 'text-food-orange' : 'text-gray-500'
          }`}
        >
          <Compass size={20} />
          <span className="text-[10px]">Discover</span>
        </Link>

        <Link 
          to="/map" 
          className={`flex flex-col items-center gap-1 ${
            isActive('/map') ? 'text-food-orange' : 'text-gray-500'
          }`}
        >
          <Map size={20} />
          <span className="text-[10px]">Map</span>
        </Link>

        {/* Dynamic Center scan button */}
        <Link 
          to="/qr-scanner" 
          className="flex flex-col items-center justify-center bg-gradient-to-r from-food-orange to-food-amber w-12 h-12 rounded-full -translate-y-4 shadow-glow-orange text-black"
        >
          <QrCode size={22} />
        </Link>

        <Link 
          to="/trending" 
          className={`flex flex-col items-center gap-1 ${
            isActive('/trending') ? 'text-food-orange' : 'text-gray-500'
          }`}
        >
          <Flame size={20} />
          <span className="text-[10px]">Trending</span>
        </Link>

        <Link 
          to={isAuthenticated ? "/profile" : "/login"} 
          className={`flex flex-col items-center gap-1 ${
            isActive('/profile') || isActive('/login') ? 'text-food-orange' : 'text-gray-500'
          }`}
        >
          <User size={20} />
          <span className="text-[10px]">Profile</span>
        </Link>
      </nav>

    </div>
  );
};
