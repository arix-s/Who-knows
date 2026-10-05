import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Check, X, Clock } from 'lucide-react';
import { FriendChallenge } from '../types/social';
import { renderAvatarBadge } from '../utils/userProfile';
import { soundFx } from '../utils/audio';

interface ChallengeReceivedModalProps {
  challenge: FriendChallenge | null;
  onAccept: (challengeId: string) => void;
  onReject: (challengeId: string) => void;
}

export const ChallengeReceivedModal: React.FC<ChallengeReceivedModalProps> = ({
  challenge,
  onAccept,
  onReject
}) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!challenge) return;

    soundFx.playMatchFound();
    const calculateTime = () => {
      const remaining = Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        onReject(challenge.id);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [challenge, onReject]);

  if (!challenge) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-full max-w-sm bg-[#090d16] border-2 border-amber-500 rounded-3xl p-5 space-y-4 text-center shadow-2xl shadow-amber-500/20 relative overflow-hidden"
        >
          {/* Header Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
            <Swords className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 block uppercase">مواجهة مباشرة 1v1</span>
            <h2 className="text-xl font-black text-slate-100 font-['Alexandria',sans-serif]">
              أرسل لك الصديق تحدياً! ⚔️
            </h2>
          </div>

          {/* Challenger Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center gap-3 text-right">
            {renderAvatarBadge(challenge.challengerAvatar, "w-12 h-12")}
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-100 block truncate">
                {challenge.challengerName}
              </span>
              <span className="text-xs font-mono text-cyan-400 font-semibold block">
                {challenge.challengerUsername}
              </span>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <Clock className="w-4 h-4 animate-spin" />
            <span>ينتهي التحدي خلال: {timeLeft} ثانية</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => onAccept(challenge.id)}
              className="py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer flutter-touch active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>قبول التحدي</span>
            </button>

            <button
              onClick={() => onReject(challenge.id)}
              className="py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer flutter-touch"
            >
              <X className="w-4 h-4" />
              <span>رفض</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
