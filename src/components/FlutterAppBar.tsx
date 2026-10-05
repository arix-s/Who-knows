import React, { useState } from 'react';
import { ChevronRight, Volume2, VolumeX, HelpCircle, Bell, Users, HelpCircle as QuestionIcon } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { LocalUserProfile, renderAvatarBadge } from '../utils/userProfile';

interface FlutterAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  userProfile: LocalUserProfile;
  unreadNotificationsCount?: number;
  onOpenProfile: () => void;
  onOpenRules: () => void;
  onOpenNotifications?: () => void;
  onOpenSocialHub?: () => void;
}

export const FlutterAppBar: React.FC<FlutterAppBarProps> = ({
  title = 'مَن يعرف؟',
  showBack = false,
  onBack,
  userProfile,
  unreadNotificationsCount = 0,
  onOpenProfile,
  onOpenRules,
  onOpenNotifications,
  onOpenSocialHub
}) => {
  const [audioEnabled, setAudioEnabled] = useState(soundFx.isEnabled());

  const toggleAudio = () => {
    const next = !audioEnabled;
    soundFx.setEnabled(next);
    setAudioEnabled(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#060a12]/95 backdrop-blur-xl border-b border-amber-500/25 h-14 px-3.5 flex items-center justify-between shrink-0 select-none shadow-lg shadow-black/40">
      
      {/* Right Slot (RTL): Back Button OR New "مَن يعرف؟" Game Logo Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400 flex items-center justify-center flutter-touch hover:bg-amber-500/20 cursor-pointer transition-colors shrink-0"
            aria-label="مغادرة"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0 border border-amber-300/40 relative group">
            <QuestionIcon className="w-5 h-5 stroke-[2.8]" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs sm:text-sm font-black tracking-tight text-slate-100 font-['Alexandria',sans-serif] truncate">
              {title}
            </span>
            {!showBack && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                مباشر
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Left Slot (RTL): Organized Action Controls Bar */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* 1. Audio Toggle */}
        <button
          onClick={toggleAudio}
          className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 flex items-center justify-center flutter-touch cursor-pointer transition-colors"
          title={audioEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* 2. Rules & Help */}
        <button
          onClick={onOpenRules}
          className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 flex items-center justify-center flutter-touch cursor-pointer transition-colors"
          title="القواعد والتعليمات"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* 3. Notifications Icon with Badge */}
        {!showBack && onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 flex items-center justify-center flutter-touch cursor-pointer transition-colors relative"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-mono font-bold animate-bounce shadow-md shadow-rose-500/50">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* 4. Social Friends Icon */}
        {!showBack && onOpenSocialHub && (
          <button
            onClick={onOpenSocialHub}
            className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 flex items-center justify-center flutter-touch cursor-pointer transition-colors"
            title="الأصدقاء والتواصل"
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* 5. Profile Avatar */}
        {!showBack && (
          <button
            onClick={onOpenProfile}
            className="flutter-touch cursor-pointer hover:opacity-90 transition-opacity pr-0.5"
            title="تعديل الملف الشخصي"
          >
            {renderAvatarBadge(userProfile.avatar, "w-8 h-8")}
          </button>
        )}
      </div>

    </header>
  );
};
