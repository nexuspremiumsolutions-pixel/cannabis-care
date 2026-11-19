import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Package,
  CreditCard,
  Gift,
  ShieldAlert,
  Sparkles,
  Info,
  Archive,
  Trash2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { Notification, NotificationCategory } from '../../types/entities';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreferences: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenPreferences,
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=50');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, status: 'READ' } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, status: 'READ' })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/archive`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to archive notification:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleItemClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    // Record interaction
    fetch(`/api/notifications/${notif.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'IN_APP' }),
    }).catch(() => {});

    if (notif.deepLink && onNavigateTab) {
      const cleanPath = notif.deepLink.replace(/^\//, '');
      const primaryTab = cleanPath.split('/')[0] || 'dashboard';
      onNavigateTab(primaryTab);
      onClose();
    }
  };

  if (!isOpen) return null;

  const categories = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'ORDER', label: 'Commandes' },
    { key: 'DELIVERY', label: 'Livraison' },
    { key: 'PAYMENT', label: 'Paiements' },
    { key: 'LOYALTY', label: 'Fidélité' },
    { key: 'SECURITY', label: 'Sécurité' },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategory === 'ALL') return true;
    return n.category === selectedCategory;
  });

  const getCategoryIcon = (category?: NotificationCategory) => {
    switch (category) {
      case 'ORDER':
        return <Package className="w-4 h-4 text-indigo-600" />;
      case 'DELIVERY':
        return <Package className="w-4 h-4 text-teal-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'LOYALTY':
        return <Gift className="w-4 h-4 text-amber-600" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'SUBSCRIPTION':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-800 text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Centre de Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-extrabold">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500">Alertes commandes, sécurité et fidélité</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action toolbar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition shrink-0 cursor-pointer ${
                  selectedCategory === c.key
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onOpenPreferences();
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              title="Préférences de communication"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Chargement des notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Aucune notification</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Vous recevrez ici vos confirmations de commande, suivis de colis et récompenses.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.isRead;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 rounded-xl transition cursor-pointer flex gap-3 group relative ${
                    isUnread ? 'bg-teal-50/50 hover:bg-teal-50' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  {/* Category icon */}
                  <div className="mt-0.5 p-2 rounded-lg bg-slate-100 shrink-0 self-start">
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Body & content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isUnread ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.body || notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span>{formatTimestamp(notif.createdAt)}</span>
                      {notif.deepLink && (
                        <span className="flex items-center gap-0.5 text-teal-700 font-medium">
                          Voir détails <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white/90 rounded-lg p-0.5 shadow-xs border border-slate-200">
                    <button
                      onClick={(e) => handleArchive(notif.id, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Archiver"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-1 rounded-md text-rose-400 hover:text-rose-700 hover:bg-rose-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Communications sécurisées Nexus</span>
          <button
            onClick={() => {
              onClose();
              if (onNavigateTab) onNavigateTab('notifications');
            }}
            className="text-teal-700 font-bold hover:underline cursor-pointer"
          >
            Ouvrir la page complète →
          </button>
        </div>
      </div>
    </div>
  );
};
