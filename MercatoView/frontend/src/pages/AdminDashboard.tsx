import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MapComponent } from '../components/MapComponent';
import { 
  ShieldCheck, Check, X, RefreshCw, Star, 
  Map, UserX, AlertTriangle, Flame, ShieldAlert
} from 'lucide-react';

interface AnalyticsData {
  total_users: number;
  total_stalls: number;
  pending_stalls_count: number;
  total_reviews: number;
  heatmap_data: any[];
}

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stalls, setStalls] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'kpis' | 'registrations' | 'crowd' | 'users'>('kpis');

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      api.get('analytics/admin/'),
      api.get('stalls/?is_approved=false'), // pending stalls
      api.get('stalls/?is_approved=true'),  // approved stalls
      api.get('auth/profile/'), // check role
    ]).then(([analyticsRes, pendingRes, approvedRes]) => {
      setAnalytics(analyticsRes.data);
      // Combine for crowd controls
      setStalls([...pendingRes.data, ...approvedRes.data]);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAdminData();
    // Simulate user list for admin control
    setUsers([
      { id: 10, username: 'spammer_99', email: 'spam@gmail.com', role: 'CUSTOMER', is_active: true },
      { id: 11, username: 'fake_vendor', email: 'fake@gmail.com', role: 'SELLER', is_active: true },
      { id: 12, username: 'good_user', email: 'good@gmail.com', role: 'CUSTOMER', is_active: true }
    ]);
  }, []);

  const handleApproveStall = async (id: number) => {
    try {
      await api.patch(`stalls/${id}/`, { is_approved: true });
      alert('Stall registration approved successfully!');
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectStall = async (id: number) => {
    if (confirm('Are you sure you want to decline this registration?')) {
      try {
        await api.delete(`stalls/${id}/`);
        alert('Stall registration declined.');
        fetchAdminData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateCrowdLevel = async (id: number, level: string) => {
    try {
      await api.patch(`stalls/${id}/`, { crowd_level: level });
      setStalls(prev => prev.map(s => s.id === id ? { ...s, crowd_level: level } : s));
      // Refresh heatmap data
      const analyticsRes = await api.get('analytics/admin/');
      setAnalytics(prev => prev ? { ...prev, heatmap_data: analyticsRes.data.heatmap_data } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = !u.is_active;
        alert(`Account '${u.username}' has been ${nextStatus ? 'activated' : 'suspended'}.`);
        return { ...u, is_active: nextStatus };
      }
      return u;
    }));
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Retrieving system administrator records...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            <span>Admin Control Panel</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            System moderation, vendor registrations, active crowd heatmaps, and user account status logs.
          </p>
        </div>
        <button 
          onClick={fetchAdminData}
          className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 border border-white/10"
        >
          <RefreshCw size={13} />
          <span>Refresh System</span>
        </button>
      </div>

      {/* ADMIN TABS */}
      <div className="flex border-b border-white/5 gap-2">
        {(['kpis', 'registrations', 'crowd', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-red-500 text-red-500' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'kpis' ? 'Platform KPIs' : tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: PLATFORM KPIS & CROWD HEATMAP */}
      {activeTab === 'kpis' && analytics && (
        <div className="space-y-8">
          {/* KPI numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Registered Accounts</span>
              <span className="text-3xl font-black text-white mt-1 block">{analytics.total_users}</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Approved Stalls</span>
              <span className="text-3xl font-black text-white mt-1 block">{analytics.total_stalls}</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Registration Queue</span>
              <span className="text-3xl font-black text-red-500 mt-1 block">{analytics.pending_stalls_count}</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Review Feeds</span>
              <span className="text-3xl font-black text-white mt-1 block">{analytics.total_reviews}</span>
            </div>

          </div>

          {/* Active Heatmap visualization */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Map size={18} className="text-red-500" />
                <span>Live Crowd Heatmap Overlay</span>
              </h3>
              <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded uppercase font-mono">Heatmap Active</span>
            </div>

            <div className="h-96 rounded-xl overflow-hidden relative border border-white/10">
              <MapComponent 
                stalls={stalls.filter(s => s.is_approved)} 
                showHeatmap={true} 
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: REGISTRATION APPROVAL QUEUE */}
      {activeTab === 'registrations' && (
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-bold text-white text-base">Pending Stall Approvals ({stalls.filter(s => !s.is_approved).length})</h3>
          
          <div className="space-y-4">
            {stalls.filter(s => !s.is_approved).map((s) => (
              <div key={s.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">{s.name}</h4>
                  <p className="text-[10px] text-gray-400">{s.cuisine_type} • Section: {s.location?.section_name || 'Main Gate'}</p>
                  <p className="text-xs text-gray-300 line-clamp-2 max-w-lg mt-1">{s.description}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveStall(s.id)}
                    className="bg-emerald-500 text-black font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1 hover:opacity-90 transition-all"
                  >
                    <Check size={14} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectStall(s.id)}
                    className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-3 py-1.5 rounded flex items-center gap-1 hover:bg-red-500/25 transition-all"
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
            {stalls.filter(s => !s.is_approved).length === 0 && (
              <p className="text-xs text-gray-500 italic">No pending vendor approvals at the moment.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CROWD LEVEL & featured OVERRIDES */}
      {activeTab === 'crowd' && (
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-bold text-white text-base">Vendor Crowd Control & Metrics</h3>
          
          <div className="space-y-3">
            {stalls.filter(s => s.is_approved).map((s) => (
              <div key={s.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-xs text-white">{s.name}</h4>
                  <p className="text-[10px] text-gray-500">{s.cuisine_type} • Section: {s.location?.section_name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Set Crowd Level:</span>
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleUpdateCrowdLevel(s.id, level)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                        s.crowd_level === level
                          ? level === 'HIGH' ? 'bg-red-500 text-black border-red-500' :
                            level === 'MEDIUM' ? 'bg-orange-500 text-black border-orange-500' : 'bg-emerald-500 text-black border-emerald-500'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: USER BANNING & SUSPENSIONS */}
      {activeTab === 'users' && (
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-bold text-white text-base">User Moderation & Account Suspension</h3>
          
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-xs text-white">{u.username}</span>
                  <p className="text-[10px] text-gray-500">{u.email} • Role: {u.role}</p>
                </div>

                <button
                  onClick={() => handleToggleUserStatus(u.id)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    u.is_active
                      ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                      : 'bg-emerald-500 text-black hover:opacity-90'
                  }`}
                >
                  <UserX size={13} />
                  <span>{u.is_active ? 'Suspend Account' : 'Reactivate'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
