import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bell, Check, Clock } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  notification_type: 'INFO' | 'ALERT' | 'PROMO' | 'REVIEW';
  created_at: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    api.get('notifications/').then((res) => {
      setNotifications(res.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('notifications/mark-all-read/');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.post(`notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'ALERT':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'PROMO':
        return 'bg-orange-500/10 border-orange-500/20 text-food-orange';
      case 'REVIEW':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'INFO':
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={22} className="text-food-orange" />
            <span>Notifications Inbox</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Stay updated with trending alerts, reviews, and stall promotions.
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-food-orange hover:underline font-semibold flex items-center gap-1"
          >
            <Check size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-gray-500">Retrieving inbox alerts...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
              className={`p-4 rounded-xl border flex gap-4 items-start transition-all ${
                notif.is_read 
                  ? 'bg-white/5 border-white/5 opacity-70' 
                  : 'bg-white/10 border-white/10 shadow-lg hover:border-food-orange/20 cursor-pointer'
              }`}
            >
              <span className={`px-2 py-1 text-[9px] font-mono font-bold rounded border uppercase shrink-0 ${getTypeStyle(notif.notification_type)}`}>
                {notif.notification_type}
              </span>
              
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-xs text-white">{notif.title}</h4>
                  <span className="text-[9px] text-gray-500 font-mono flex items-center gap-0.5 shrink-0">
                    <Clock size={10} /> {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-card rounded-2xl text-gray-500 text-xs">
          🔕 Your notification box is empty.
        </div>
      )}
    </div>
  );
};
