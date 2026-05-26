import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { User, ShieldCheck, Mail, LogOut, CheckCircle } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [preferences, setPreferences] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      if (user.role === 'CUSTOMER' && user.profile) {
        setBio(user.profile.bio || '');
        setPreferences(JSON.stringify(user.profile.preferences || {}, null, 2));
      } else if (user.role === 'SELLER' && user.profile) {
        setBusinessName(user.profile.business_name || '');
        setContactNumber(user.profile.contact_number || '');
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg('');

    try {
      const data: any = { email };
      if (user?.role === 'CUSTOMER') {
        let parsedPrefs = {};
        try {
          if (preferences) parsedPrefs = JSON.parse(preferences);
        } catch {
          throw new Error('Preferences must be valid JSON format');
        }
        data.profile = { bio, preferences: parsedPrefs };
      } else if (user?.role === 'SELLER') {
        data.profile = { business_name: businessName, contact_number: contactNumber };
      }

      await updateProfile(data);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center py-12 text-gray-500">🔒 Please sign in to view settings.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User size={24} className="text-food-orange" />
          <span>Profile Settings</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Update your public profile, contact details, and platform credentials.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-xl">
          ✨ Profile settings saved successfully!
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
        
        {/* Username (read-only) */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Username (Primary)</label>
          <input
            type="text"
            disabled
            value={user.username}
            className="w-full input-field opacity-60 cursor-not-allowed font-mono text-xs"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full input-field text-xs"
          />
        </div>

        {/* Role Badge */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">System Account Role</label>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-white/10 text-xs font-semibold uppercase text-gray-300">
            <ShieldCheck size={14} className="text-food-orange" />
            <span>{user.role}</span>
          </span>
        </div>

        {/* Customer Specific Fields */}
        {user.role === 'CUSTOMER' && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Bio Description</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell vendors about your food journey..."
                rows={3}
                className="w-full input-field text-xs py-2.5"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Food Preferences (JSON format)</label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder='e.g. { "favorite_cuisines": ["grill", "desserts"] }'
                rows={4}
                className="w-full input-field font-mono text-xs py-2.5"
              />
            </div>
          </div>
        )}

        {/* Seller Specific Fields */}
        {user.role === 'SELLER' && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Business / Brand Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full input-field text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Contact Phone Number</label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full input-field text-xs"
              />
            </div>
            {user.profile?.is_verified && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle size={14} />
                <span>Verification Documents Approved</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 text-xs py-3"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            type="button"
            onClick={logout}
            className="btn-secondary text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 px-6"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

      </form>
    </div>
  );
};
