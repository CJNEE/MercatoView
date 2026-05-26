import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Shield, Sparkles, User, ShoppingBag, Eye, EyeOff } from 'lucide-react';

export const LoginRegister: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
        navigate('/');
      } else {
        // Build register data
        const data: any = { username, email, password, role };
        if (role === 'SELLER') {
          data.business_name = businessName;
          data.contact_number = contactNumber;
        }
        await register(data);
        setSuccessMsg('Account registered successfully! Please sign in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || 
        err.response?.data?.username?.[0] || 
        err.response?.data?.email?.[0] || 
        'An error occurred. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-white/10 relative overflow-hidden">
        
        {/* Decorative backdrop light */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-food-orange/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-food-amber/10 rounded-full blur-3xl -z-10"></div>

        {/* Title Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-food-orange to-food-amber bg-clip-text text-transparent font-sans tracking-wide">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-gray-400 mt-2">
            {isLogin ? 'Discover the best food in Mercato Lucena' : 'Join the digital food hub community'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl mb-6">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-500/15 border border-green-500/30 text-green-400 text-xs px-4 py-3 rounded-xl mb-6">
            ✨ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Toggle Login vs Register */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5 mb-2">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  role === 'CUSTOMER' 
                    ? 'bg-gradient-to-r from-food-orange to-food-amber text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User size={14} />
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('SELLER')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  role === 'SELLER' 
                    ? 'bg-gradient-to-r from-food-orange to-food-amber text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShoppingBag size={14} />
                <span>Seller / Vendor</span>
              </button>
            </div>
          )}

          {/* 2. Inputs */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. foodlover123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full input-field"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. customer@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input-field"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Seller Registration Fields */}
          {!isLogin && role === 'SELLER' && (
            <div className="space-y-4 pt-2 border-t border-white/5 animate-fadeIn">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Business / Stall Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sizzling Grill House"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full input-field"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Contact Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +63 917 123 4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full input-field"
                />
              </div>
            </div>
          )}

          {/* 3. Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-bold mt-4 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Profile'}
          </button>
        </form>

        {/* 4. Switch Toggle */}
        <div className="text-center mt-6 text-xs text-gray-400">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-food-orange hover:underline font-semibold"
              >
                Register here
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-food-orange hover:underline font-semibold"
              >
                Sign In here
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
