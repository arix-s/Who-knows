import React from 'react';
import { X, Bell, CheckCheck, UserPlus, Swords, CheckCircle2, AlertCircle } from 'lucide-react';
import { SocialNotification } from '../types/social';

interface NotificationsBottomSheetProps {
  isOpen: boolean;
  notifications: SocialNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenSocialHub: () => void;
}

export const NotificationsBottomSheet: React.FC<NotificationsBottomSheetProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onOpenSocialHub
}) => {
  if (!isOpen) return null;

  const renderIcon = (type: SocialNotification['type']) => {
    switch (type) {
      case 'friend_request_received':
      case 'friend_request_accepted':
        return <UserPlus className="w-5 h-5 text-emerald-400" />;
      case 'challenge_received':
      case 'challenge_accepted':
        return <Swords className="w-5 h-5 text-amber-400" />;
      case 'challenge_rejected':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-[480px] bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] flex flex-col">
        
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-['Alexandria',sans-serif]">مركز الإشعارات</h2>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>قراءة الكل</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {notifications.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-slate-500">
              <Bell className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-xs font-semibold">لا توجد إشعارات حالياً</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  onMarkRead(n.id);
                  onOpenSocialHub();
                  onClose();
                }}
                className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  !n.read
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  {renderIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 text-right space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-100">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
