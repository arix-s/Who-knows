import React, { useState } from 'react';
import { X, User, Check, AtSign } from 'lucide-react';
import { LocalUserProfile, AVATARS, saveUserProfile, renderAvatarBadge } from '../utils/userProfile';

interface UserProfileBottomSheetProps {
  isOpen: boolean;
  userProfile: LocalUserProfile;
  onClose: () => void;
  onUpdateProfile: (updated: LocalUserProfile) => void;
}

export const UserProfileBottomSheet: React.FC<UserProfileBottomSheetProps> = ({
  isOpen,
  userProfile,
  onClose,
  onUpdateProfile
}) => {
  const [name, setName] = useState(userProfile.name);
  const [username, setUsername] = useState(
    userProfile.username ? userProfile.username.replace(/^@/, '') : `player_${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile.avatar);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '') || `player_${Math.floor(1000 + Math.random() * 9000)}`;

    const updated: LocalUserProfile = {
      ...userProfile,
      name: name.trim(),
      username: `@${cleanUsername}`,
      avatar: selectedAvatar
    };

    saveUserProfile(updated);
    onUpdateProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-[480px] bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-['Alexandria',sans-serif]">الملف الشخصي والإحصائيات</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lifetime Record */}
        <div className="grid grid-cols-3 gap-2 text-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="block text-[10px] text-slate-400">المباريات</span>
            <span className="text-sm font-bold font-mono text-slate-200">{userProfile.gamesPlayed}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400">الانتصارات</span>
            <span className="text-sm font-bold font-mono text-emerald-400">{userProfile.wins}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400">النقاط</span>
            <span className="text-sm font-bold font-mono text-amber-400">{userProfile.totalPoints}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Avatar Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">اختر الأيقونة والشخصية:</label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all flutter-touch cursor-pointer ${
                    selectedAvatar === av.id
                      ? 'bg-amber-500/20 border-amber-400 scale-105'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {renderAvatarBadge(av.id, "w-8 h-8")}
                  <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center mt-0.5">
                    {av.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">اسم المتسابق:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك"
              maxLength={20}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-100 font-bold text-xs outline-none"
            />
          </div>

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5 text-cyan-400" />
              اسم المستخدم (اليوزر):
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono font-bold text-xs text-cyan-400">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                maxLength={18}
                dir="ltr"
                className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-100 font-mono font-bold text-xs outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 flutter-touch cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>حفظ التغييرات</span>
          </button>

        </form>

      </div>
    </div>
  );
};
