import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Swords, CheckCircle2, Wifi, ShieldCheck, Database, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { LocalUserProfile, renderAvatarBadge } from '../utils/userProfile';
import { RoomState } from '../types/game';
import { soundFx } from '../utils/audio';

interface QuickMatchSearchingScreenProps {
  userProfile: LocalUserProfile;
  matchedRoom: RoomState | null;
  onCancel: () => void;
  onRetry: () => void;
}

export const QuickMatchSearchingScreen: React.FC<QuickMatchSearchingScreenProps> = ({
  userProfile,
  matchedRoom,
  onCancel,
  onRetry
}) => {
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);
  const [checkStep, setCheckStep] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(!soundFx.isEnabled());

  // Search Timer & Continuous eFootball Matchmaking Audio
  useEffect(() => {
    if (matchedRoom) {
      soundFx.stopSearchPulse();
      return;
    }

    soundFx.playSearchPulse();
    const interval = setInterval(() => {
      setSearchSeconds((prev) => {
        const next = prev + 1;
        if (next >= 30) {
          setIsTimeout(true);
          soundFx.stopSearchPulse();
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      soundFx.stopSearchPulse();
    };
  }, [matchedRoom]);

  // Pre-match readiness check steps sequence when match found
  useEffect(() => {
    if (matchedRoom) {
      soundFx.playMatchFound();
      setCheckStep(1);

      const t1 = setTimeout(() => setCheckStep(2), 600);
      const t2 = setTimeout(() => setCheckStep(3), 1200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [matchedRoom]);

  const toggleMute = () => {
    const next = isAudioMuted;
    soundFx.setEnabled(next);
    setIsAudioMuted(!next);
  };

  const opponentObj = matchedRoom
    ? matchedRoom.host.id === userProfile.id
      ? matchedRoom.guest
      : matchedRoom.host
    : null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCancelClick = () => {
    soundFx.stopSearchPulse();
    onCancel();
  };

  return (
    <div className="min-h-[520px] flex flex-col items-center justify-between p-4 text-center select-none animate-fade-in relative max-w-md mx-auto">
      
      {/* Top Bar Controls */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>مواجهة سريعة 1v1</span>
        </div>

        <button
          onClick={toggleMute}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 flex items-center justify-center cursor-pointer transition-colors"
          title={isAudioMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
      </div>

      {/* MATCH FOUND WITH FACE-OFF VS CARD */}
      <AnimatePresence mode="wait">
        {matchedRoom && opponentObj ? (
          <motion.div
            key="matched"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full space-y-5 my-auto py-2"
          >
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest block animate-pulse">
                تم الاقتران بنجاح
              </span>
              <h1 className="text-2xl font-black text-slate-100 font-['Alexandria',sans-serif]">
                تم العثور على منافس! 🎉
              </h1>
            </div>

            {/* Face-off Cards (Slide into position) */}
            <div className="grid grid-cols-3 gap-2 items-center my-4">
              
              {/* You */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flutter-card p-3 flex flex-col items-center gap-2 border-2 border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10"
              >
                {renderAvatarBadge(userProfile.avatar, "w-12 h-12")}
                <div className="min-w-0 w-full">
                  <span className="text-[10px] font-extrabold text-amber-400 block">أنت</span>
                  <span className="text-xs font-bold text-slate-100 truncate block">{userProfile.name}</span>
                </div>
              </motion.div>

              {/* VS Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/40 font-black text-base border-2 border-slate-950 animate-bounce"
              >
                VS
              </motion.div>

              {/* Opponent */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flutter-card p-3 flex flex-col items-center gap-2 border-2 border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
              >
                {renderAvatarBadge(opponentObj.avatar, "w-12 h-12")}
                <div className="min-w-0 w-full">
                  <span className="text-[10px] font-extrabold text-cyan-400 block">المنافس</span>
                  <span className="text-xs font-bold text-slate-100 truncate block">{opponentObj.name}</span>
                </div>
              </motion.div>

            </div>

            {/* Pre-Match Verification Procedures Box */}
            <div className="flutter-card p-3.5 space-y-2.5 text-right border-amber-500/30 bg-slate-950/90 shadow-xl">
              <span className="text-[11px] font-bold text-slate-400 block border-b border-slate-800/80 pb-1.5 text-center">
                إجراءات المزامنة والجاهزية للمباراة ⚡
              </span>

              <div className="space-y-2 text-xs">
                
                {/* Step 1: Ping Check */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-200">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    فحص استقرار الاتصال (Ping: 24ms)
                  </span>
                  {checkStep >= 1 ? (
                    <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ممتازة
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] animate-pulse">جاري الفحص...</span>
                  )}
                </div>

                {/* Step 2: Server Question Sync */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-200">
                    <Database className="w-4 h-4 text-cyan-400" />
                    مزامنة حزمة الأسئلة وقواعد الجولة
                  </span>
                  {checkStep >= 2 ? (
                    <span className="text-cyan-400 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> مكتملة
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] animate-pulse">جاري المزامنة...</span>
                  )}
                </div>

                {/* Step 3: Readiness Confirmation */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    تأكيد حضور وثبات جاهزية المتسابقين
                  </span>
                  {checkStep >= 3 ? (
                    <span className="text-amber-400 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> مؤكدة ✓
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] animate-pulse">انتظار التأكيد...</span>
                  )}
                </div>

              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  style={{ width: checkStep === 3 ? '100%' : checkStep === 2 ? '66%' : '33%' }}
                />
              </div>

            </div>

          </motion.div>
        ) : isTimeout ? (
          /* TIMEOUT STATE */
          <motion.div
            key="timeout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full space-y-6 my-auto py-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <Swords className="w-8 h-8 opacity-60" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100 font-['Alexandria',sans-serif]">
                لم نعثر على منافس حتى الآن
              </h2>
              <p className="text-xs text-slate-400">جميع المتسابقين مشغولون حالياً، هل ترغب في المتابعة؟</p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  setIsTimeout(false);
                  setSearchSeconds(0);
                  onRetry();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 flutter-touch cursor-pointer active:scale-98 transition-transform"
              >
                <RefreshCw className="w-4 h-4" />
                <span>متابعة البحث</span>
              </button>

              <button
                onClick={handleCancelClick}
                className="w-full py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 flutter-touch cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>إلغاء البحث</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* ACTIVE SEARCHING STATE */
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full space-y-6 my-auto py-2"
          >
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-100 font-['Alexandria',sans-serif]">
                جاري البحث عن منافس
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                نبحث لك عن لاعب مناسب...
              </p>
            </div>

            {/* Flutter-style Radar Searching Animation */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-4">
              
              {/* Outer Pulsing Expanding Rings */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping duration-2000" />
              <div className="absolute inset-4 rounded-full border border-amber-500/30 animate-pulse" />
              <div className="absolute inset-8 rounded-full border-2 border-dashed border-amber-500/40 animate-spin border-t-amber-400 duration-3000" />

              {/* Glowing Pulse Aura */}
              <div className="absolute inset-12 rounded-full bg-amber-500/10 blur-md animate-pulse" />

              {/* Center User Avatar */}
              <div className="relative z-10 shadow-2xl shadow-amber-500/30">
                {renderAvatarBadge(userProfile.avatar, "w-16 h-16")}
              </div>

            </div>

            {/* Live Search Timer */}
            <div className="space-y-1">
              <span className="text-2xl font-mono font-black text-amber-400 tracking-wider block">
                {formatTimer(searchSeconds)}
              </span>
              <span className="block text-[11px] text-slate-500 font-semibold">مدة البحث الجاري</span>
            </div>

            {/* Cancel Search Button */}
            <button
              onClick={handleCancelClick}
              className="w-full py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 flutter-touch cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
              <span>إلغاء البحث</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
