import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '../types/game';
import { realtimeService } from '../services/realtimeService';

export const ConnectionStatusBar: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connected');

  useEffect(() => {
    const unsub = realtimeService.subscribeConnectionStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, []);

  if (status === 'connected') return null; // Hide when healthy

  const getStatusBadge = () => {
    switch (status) {
      case 'connecting':
      case 'reconnecting':
        return {
          text: 'فقدنا الاتصال، جاري إعادة الاتصال...',
          bg: 'bg-amber-500/90 text-slate-950',
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        };
      case 'weak':
        return {
          text: 'الاتصال ضعيف، جاري المزامنة...',
          bg: 'bg-yellow-500/90 text-slate-950',
          icon: <Wifi className="w-3.5 h-3.5 animate-pulse" />
        };
      case 'disconnected':
        return {
          text: 'انقطع الاتصال بالخادم! يرجى التحقق من الشبكة',
          bg: 'bg-rose-600/90 text-white',
          icon: <WifiOff className="w-3.5 h-3.5" />
        };
      case 'restored':
        return {
          text: 'تم استعادة الاتصال بنجاح!',
          bg: 'bg-emerald-500/90 text-slate-950',
          icon: <Wifi className="w-3.5 h-3.5" />
        };
      default:
        return null;
    }
  };

  const badge = getStatusBadge();
  if (!badge) return null;

  return (
    <div className={`w-full py-1.5 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md z-50 animate-fade-in ${badge.bg}`}>
      {badge.icon}
      <span>{badge.text}</span>
    </div>
  );
};
