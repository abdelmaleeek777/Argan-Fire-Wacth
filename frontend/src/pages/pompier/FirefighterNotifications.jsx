import React, { useState, useContext } from 'react';
import { Bell, Trash2, CheckCircle2 } from 'lucide-react';
import { SocketContext } from '../../components/pompier/FirefighterLayout';

export default function FirefighterNotifications() {
  const { user } = useContext(SocketContext) || {};
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Fire alert in North Forest zone', timestamp: '10 mins ago', read: false, type: 'alert' },
    { id: 2, message: 'Team Alpha dispatched to sector B', timestamp: '30 mins ago', read: false, type: 'dispatch' },
    { id: 3, message: 'Your status has been updated', timestamp: '1 hour ago', read: true, type: 'status' },
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Notifications</h1>
        <p className="text-slate-500 font-medium mt-1">Stay updated on all alerts and incidents</p>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No notifications</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-colors ${
                notif.read
                  ? 'bg-slate-50 border-slate-100'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex-1">
                <p className={`font-bold text-sm ${notif.read ? 'text-slate-600' : 'text-slate-800'}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">{notif.timestamp}</p>
              </div>
              <div className="flex items-center gap-2">
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete notification"
                >
                  <Trash2 size={18} className="text-rose-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
