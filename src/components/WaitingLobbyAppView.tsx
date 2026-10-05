import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Share2, Swords, Clock, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { RoomState } from '../types/game';
import { renderAvatarBadge } from '../utils/userProfile';
import { realtimeService } from '../services/realtimeService';
import { CATEGORIES } from '../data/questionRepository';
import { soundFx } from '../utils/audio';

interface WaitingLobbyAppViewProps {
  room: RoomState;
  currentUserId: string;
  onLeaveRoom: () => void;
}

export const WaitingLobbyAppView: React.FC<WaitingLobbyAppViewProps> = ({
  room,
  currentUserId,
  onLeaveRoom
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadingReady, setLoadingReady] = useState(false);
  const [now, setNow] = useState(Date.now());

  const isHost = room.host.id === currentUserId;
  const me = isHost ? room.host : room.guest;
  const guestObj = room.guest;

  const categoryObj = CATEGORIES.find(c => c.id === room.category) || CATEGORIES[0];

  useEffect(() => {
    if (room.status === 'countdown') {
      const interval = setInterval(() => setNow(Date.now()), 200);
      soundFx.playTick();
      return () => clearInterval(interval);
    }
  }, [room.status]);

  const countdownSeconds = room.status === 'countdown' && room.countdownStartTime
    ? Math.max(1, Math.ceil((3000 - (now - room.countdownStartTime)) / 1000))
    : 3;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleReady = async () => {
    setLoadingReady(true);
    await realtimeService.toggleReady(room.id, currentUserId);
    setLoadingReady(false);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20 select-none relative">
      
      {/* 3-2-1 Pre-Match Countdown Overlay */}
      <AnimatePresence>
        {room.status === 'countdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-center p-6 space-y-4"
          >
            <span className="text-amber-400 font-extrabold text-sm uppercase tracking-widest">
              تبدأ المواجهة خلال...
            </span>

            <motion.span
              key={countdownSeconds}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              className="text-7xl font-mono font-black text-amber-400 text-gold-text-glow"
            >
              {countdownSeconds}
            </motion.span>

            <span className="text-xs text-slate-300 font-semibold">
              استعد للإجابة بسرعة ودقة!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>مغادرة الغرفة</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          انتظار 1v1
        </span>
      </div>

      {/* Room Code Card */}
      <div className="flutter-card p-4 text-center space-y-3">
        <div>
          <span className="text-[11px] text-slate-400 font-semibold block">رمز الغرفة الخاصة</span>
          <span className="text-2xl font-mono font-black tracking-widest text-amber-400 text-gold-text-glow select-all my-0.5 block">
            {room.id}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={copyRoomCode}
            className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition-all border border-amber-500/30 flutter-touch cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'تم النسخ' : 'نسخ الرمز'}</span>
          </button>

          <button
            onClick={copyShareLink}
            className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all border border-slate-700 flutter-touch cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم النسخ' : 'رابط دعوة'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-300 pt-1 border-t border-slate-800/80">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            <Layers className="w-3 h-3 text-amber-400" /> {categoryObj.name}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> {room.questionCount} أسئلة
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            <Clock className="w-3 h-3 text-emerald-400" /> {room.secondsPerQuestion}ث
          </span>
        </div>
      </div>

      {/* Face-off Cards */}
      <div className="space-y-2.5">
        
        {/* Host Card */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
          room.host.ready
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {renderAvatarBadge(room.host.avatar, "w-10 h-10")}

            <div className="min-w-0">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                صانع الغرفة
              </span>
              <h3 className="text-xs font-bold text-slate-100 truncate mt-0.5">{room.host.name}</h3>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            room.host.ready
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {room.host.ready ? '✓ جاهز' : 'غير جاهز'}
          </span>
        </div>

        {/* Guest Card */}
        {guestObj ? (
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
            guestObj.ready
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {renderAvatarBadge(guestObj.avatar, "w-10 h-10")}

              <div className="min-w-0">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  المنافس
                </span>
                <h3 className="text-xs font-bold text-slate-100 truncate mt-0.5">{guestObj.name}</h3>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              guestObj.ready
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {guestObj.ready ? '✓ جاهز' : 'غير جاهز'}
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 block">بانتظار انضمام الخصم...</span>
            <p className="text-[10px] text-slate-500">أرسل رمز الغرفة لصديقك للدخول فوراً</p>
          </div>
        )}

      </div>

      {/* Sticky Action Button */}
      <div className="fixed bottom-4 left-0 right-0 max-w-[480px] mx-auto px-4 z-30">
        <button
          onClick={handleToggleReady}
          disabled={loadingReady || !guestObj}
          className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 flutter-touch cursor-pointer ${
            me?.ready
              ? 'bg-slate-800 border-2 border-emerald-500 text-emerald-300'
              : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-amber-500/20'
          } disabled:opacity-50`}
        >
          <Swords className="w-5 h-5 stroke-[2.5]" />
          <span>{me?.ready ? 'أنا جاهز (إلغاء التجهيز)' : 'أنا جاهز وبانتظار الخصم'}</span>
        </button>
      </div>

    </div>
  );
};
