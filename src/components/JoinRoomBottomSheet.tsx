import React, { useState } from 'react';
import { X, LogIn, Loader2, KeyRound } from 'lucide-react';
import { realtimeService } from '../services/realtimeService';
import { LocalUserProfile } from '../utils/userProfile';
import { RoomState } from '../types/game';

interface JoinRoomBottomSheetProps {
  isOpen: boolean;
  initialCode?: string;
  userProfile: LocalUserProfile;
  onClose: () => void;
  onRoomJoined: (room: RoomState) => void;
}

export const JoinRoomBottomSheet: React.FC<JoinRoomBottomSheetProps> = ({
  isOpen,
  initialCode = '',
  userProfile,
  onClose,
  onRoomJoined
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('أدخل رمز الغرفة');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await realtimeService.joinRoom(cleanCode, {
      id: userProfile.id,
      name: userProfile.name,
      avatar: userProfile.avatar
    });

    setLoading(false);

    if (result.error || !result.room) {
      setErrorMsg(result.error || 'تعذر الانضمام للغرفة.');
    } else {
      onRoomJoined(result.room);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-[480px] bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
        
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-['Alexandria',sans-serif]">الدخول إلى غرفة</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">رمز الغرفة (6 رموز):</label>
            <div className="relative">
              <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="X7K9P2"
                maxLength={10}
                className="w-full pr-10 pl-3 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-100 font-mono font-bold tracking-widest text-base text-center uppercase outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 flutter-touch cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الانضمام...</span>
              </>
            ) : (
              <span>دخول الغرفة</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
