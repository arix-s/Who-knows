import React from 'react';
import { Home, PlusCircle, Users, User, Swords } from 'lucide-react';

interface FlutterBottomNavProps {
  activeTab: 'home' | 'create' | 'social' | 'profile';
  unreadSocialCount?: number;
  onSelectTab: (tab: 'home' | 'create' | 'social' | 'profile') => void;
  onStartQuickMatch: () => void;
  inGameRoom: boolean;
}

export const FlutterBottomNav: React.FC<FlutterBottomNavProps> = ({
  activeTab,
  unreadSocialCount = 0,
  onSelectTab,
  onStartQuickMatch,
  inGameRoom
}) => {
  if (inGameRoom) return null; // Hide during active room / match

  return (
    <nav className="shrink-0 sticky bottom-0 z-50 bg-[#070a12]/98 backdrop-blur-xl border-t border-amber-500/25 h-16 pb-1 px-3 flex items-center justify-around select-none shadow-2xl shadow-black">
      
      {/* Home Tab */}
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-2xl flutter-touch cursor-pointer transition-all ${
          activeTab === 'home'
            ? 'text-amber-400 bg-amber-500/15 font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">الرئيسية</span>
      </button>

      {/* Create Room Tab */}
      <button
        onClick={() => onSelectTab('create')}
        className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-2xl flutter-touch cursor-pointer transition-all ${
          activeTab === 'create'
            ? 'text-amber-400 bg-amber-500/15 font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <PlusCircle className="w-5 h-5 text-amber-400" />
        <span className="text-[10px] text-amber-300 font-bold">إنشاء</span>
      </button>

      {/* Center Floating Quick Match FAB Button */}
      <button
        onClick={onStartQuickMatch}
        className="w-12 h-12 -mt-6 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/40 border-2 border-slate-950 flutter-touch cursor-pointer active:scale-95 transition-transform"
        title="مواجهة سريعة"
      >
        <Swords className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Social / Friends Tab */}
      <button
        onClick={() => onSelectTab('social')}
        className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-2xl flutter-touch cursor-pointer transition-all relative ${
          activeTab === 'social'
            ? 'text-amber-400 bg-amber-500/15 font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px]">الأصدقاء</span>
        {unreadSocialCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
        )}
      </button>

      {/* Profile Tab */}
      <button
        onClick={() => onSelectTab('profile')}
        className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-2xl flutter-touch cursor-pointer transition-all ${
          activeTab === 'profile'
            ? 'text-amber-400 bg-amber-500/15 font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">حسابي</span>
      </button>

    </nav>
  );
};
