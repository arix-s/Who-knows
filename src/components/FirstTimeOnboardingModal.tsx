import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, AtSign, Check, Swords, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';
import { LocalUserProfile, AVATARS, renderAvatarBadge } from '../utils/userProfile';

interface FirstTimeOnboardingModalProps {
  isOpen: boolean;
  currentProfile: LocalUserProfile;
  onComplete: (updatedProfile: LocalUserProfile) => void;
}

export const FirstTimeOnboardingModal: React.FC<FirstTimeOnboardingModalProps> = ({
  isOpen,
  currentProfile,
  onComplete
}) => {
  const [name, setName] = useState(currentProfile.name || '');
  const [username, setUsername] = useState(
    currentProfile.username
      ? currentProfile.username.replace(/^@/, '')
      : `player_${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [selectedAvatar, setSelectedAvatar] = useState(currentProfile.avatar || AVATARS[0].id);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '');

    if (!cleanName) {
      setErrorMsg('الرجاء إدخال الاسم الكامل أو اللقب!');
      return;
    }

    if (!cleanUsername) {
      setErrorMsg('الرجاء إدخال اسم مستخدم (يوزر) صحيح!');
      return;
    }

    setErrorMsg('');
    const updated: LocalUserProfile = {
      ...currentProfile,
      name: cleanName,
      username: `@${cleanUsername}`,
      avatar: selectedAvatar
    };

    onComplete(updated);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in select-none">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-[#090d16] border-2 border-amber-500/40 rounded-3xl p-5 space-y-5 shadow-2xl shadow-amber-500/10 text-right relative overflow-hidden"
        >
          {/* Top Decorative Header */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <HelpCircle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h2 className="text-xl font-black text-slate-100 font-['Alexandria',sans-serif] pt-1">
              مرحباً بك في لعبة مَن يعرف؟ 🎉
            </h2>
            <p className="text-xs text-amber-400 font-semibold">
              أنشئ ملفك الشخصي للدخول إلى مجتمع المواجهات المباشرة
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Banner */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-bold animate-shake">
                {errorMsg}
              </div>
            )}

            {/* Input 1: Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 pr-0.5">
                <User className="w-4 h-4 text-amber-400" />
                الاسم الظاهر للمتنافسين
              </label>
              <input
                type="text"
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك أو لقبك هنا..."
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-800 focus:border-amber-400 text-slate-100 text-xs font-bold focus:outline-none transition-colors text-right"
              />
            </div>

            {/* Input 2: Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 pr-0.5">
                <AtSign className="w-4 h-4 text-cyan-400" />
                اسم المستخدم الفريد (اليوزر)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono font-bold text-xs text-cyan-400 select-none">
                  @
                </span>
                <input
                  type="text"
                  maxLength={18}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="username_1v1"
                  dir="ltr"
                  className="w-full pl-8 pr-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs font-mono font-bold focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Input 3: Choose Avatar Badge */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between pr-0.5">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  اختر أيقونة وشارة التحدي
                </span>
                <span className="text-[10px] text-slate-400">انقر للاختيار</span>
              </label>

              <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                {AVATARS.map((av) => {
                  const isSelected = selectedAvatar === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`flutter-touch p-2 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/20'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      {renderAvatarBadge(av.id, "w-10 h-10")}
                      <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                        {av.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 flutter-touch cursor-pointer active:scale-98 transition-transform mt-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>دخول وحفظ البيانات</span>
            </button>

          </form>

        </motion.div>

      </div>
    </AnimatePresence>
  );
};
