import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Swords, PlusCircle, LogIn, ChevronLeft, Globe, Sparkles, Trophy, Atom, BookOpen, RefreshCw, Zap, Edit3 } from 'lucide-react';
import { CATEGORIES } from '../data/questionRepository';
import { LocalUserProfile, renderAvatarBadge } from '../utils/userProfile';
import { realtimeService, ActiveSession } from '../services/realtimeService';

interface HomeAppViewProps {
  userProfile: LocalUserProfile;
  onStartQuickMatch: (category?: string) => void;
  onOpenCreateRoom: (category?: string) => void;
  onOpenJoinRoom: () => void;
  onOpenProfile: () => void;
  onRestoreSession: (session: ActiveSession) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Globe: <Globe className="w-5 h-5 text-amber-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-yellow-400" />,
  Trophy: <Trophy className="w-5 h-5 text-orange-400" />,
  Atom: <Atom className="w-5 h-5 text-cyan-400" />,
  BookOpen: <BookOpen className="w-5 h-5 text-emerald-400" />
};

export const HomeAppView: React.FC<HomeAppViewProps> = ({
  userProfile,
  onStartQuickMatch,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onOpenProfile,
  onRestoreSession
}) => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    const session = realtimeService.getActiveSession();
    if (session) {
      setActiveSession(session);
    }
  }, []);

  return (
    <div className="space-y-4 animate-fade-in pb-6 select-none max-w-lg mx-auto">
      
      {/* 1. Player Profile Header Card */}
      <div className="flutter-card p-3.5 flex items-center justify-between gap-3 border-amber-500/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            {renderAvatarBadge(userProfile.avatar, "w-12 h-12")}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-100 truncate">
                {userProfile.name}
              </h2>
              <button
                onClick={onOpenProfile}
                className="text-amber-400 hover:text-amber-300 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="تعديل الاسم والأيقونة"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            {userProfile.username && (
              <span className="text-[10px] text-cyan-400 font-mono font-semibold block">
                {userProfile.username}
              </span>
            )}
            <p className="text-[11px] text-amber-400 font-semibold font-mono">
              {userProfile.wins} فوز · {userProfile.totalPoints.toLocaleString()} نقطة
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-center shrink-0">
          <span className="block text-[9px] text-slate-400">المباريات</span>
          <span className="text-xs font-black font-mono text-amber-300">{userProfile.gamesPlayed}</span>
        </div>
      </div>

      {/* 2. Active Session Recovery Card */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onRestoreSession(activeSession)}
          className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500 flex items-center justify-between gap-3 shadow-lg shadow-amber-500/10 cursor-pointer flutter-touch"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            <div>
              <span className="text-xs font-bold text-amber-300 block">لديك مباراة جارية بالفعل!</span>
              <span className="text-[10px] text-slate-400">غرفة {activeSession.roomId} · اضغط للعودة الآن</span>
            </div>
          </div>

          <span className="text-xs font-black text-slate-950 px-3 py-1 bg-amber-400 rounded-xl shrink-0">
            العودة ←
          </span>
        </motion.div>
      )}

      {/* 3. Primary Hero Action: Quick Match */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onStartQuickMatch('all')}
        className="w-full flutter-touch p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-between gap-3 shadow-xl shadow-amber-500/25 cursor-pointer border border-amber-300/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-950/20 flex items-center justify-center shrink-0">
            <Swords className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black leading-tight font-['Alexandria',sans-serif]">مواجهة سريعة</h3>
              <span className="text-[9px] font-extrabold bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-amber-400" /> أونلاين
              </span>
            </div>
            <p className="text-[11px] text-slate-900/80 font-bold mt-0.5">البحث المباشر السريع عن منافس</p>
          </div>
        </div>

        <ChevronLeft className="w-5 h-5 text-slate-950 shrink-0" />
      </motion.button>

      {/* 4. Secondary Action Cards: Create Room & Join Room */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Create Private Room Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onOpenCreateRoom('all')}
          className="flutter-touch p-3.5 rounded-2xl bg-slate-900 border-2 border-amber-500/40 text-right space-y-2.5 shadow-lg hover:border-amber-400 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-100 leading-tight">إنشاء غرفة 1v1</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">دعوة صديق برمز خاص</p>
          </div>
        </motion.button>

        {/* Join Room Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onOpenJoinRoom}
          className="flutter-touch p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-right space-y-2.5 shadow-lg hover:border-slate-700 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <LogIn className="w-4 h-4" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-100 leading-tight">انضمام برمز</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">إدخال كود غرفة صديق</p>
          </div>
        </motion.button>

      </div>

      {/* 5. Categories Section */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            اختر التصنيف المفضل للمواجهة
          </h3>
        </div>

        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartQuickMatch(cat.id)}
              className="flutter-touch flutter-card p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-500/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  {CATEGORY_ICONS[cat.iconName] || <Globe className="w-4 h-4 text-amber-400" />}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{cat.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{cat.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {cat.totalQuestions} س
                </span>
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};
