import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, CheckCircle2, XCircle, Clock, Award, Zap } from 'lucide-react';
import { RoomState, Player } from '../types/game';
import { renderAvatarBadge, updateLifetimeStats } from '../utils/userProfile';
import { soundFx } from '../utils/audio';
import { realtimeService } from '../services/realtimeService';

interface WinnerStatsAppViewProps {
  room: RoomState;
  currentUserId: string;
  onGoHome: () => void;
}

export const WinnerStatsAppView: React.FC<WinnerStatsAppViewProps> = ({
  room,
  currentUserId,
  onGoHome
}) => {
  const [rematchLoading, setRematchLoading] = useState(false);

  const isHost = room.host.id === currentUserId;
  const me = isHost ? room.host : room.guest!;
  const opponent = isHost ? room.guest : room.host;

  const isWinner = room.winnerId === currentUserId;
  const isDraw = room.winnerId === 'DRAW';

  const winnerPlayer = room.winnerId === room.host.id
    ? room.host
    : room.winnerId === room.guest?.id
    ? room.guest
    : null;

  useEffect(() => {
    soundFx.playVictory();

    if (isWinner) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 50, origin: { x: 0 } });
        confetti({ particleCount: 4, angle: 120, spread: 50, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }

    updateLifetimeStats(isWinner, isDraw, me?.score || 0);
  }, []);

  const calculatePlayerStats = (player: Player | null) => {
    if (!player) return { correct: 0, wrong: 0, avgTime: 0, maxStreak: 0 };
    const ansArray = Object.values(player.answers);
    const correct = ansArray.filter(a => a.isCorrect).length;
    const wrong = ansArray.length - correct;
    const totalTime = ansArray.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);
    const avgTime = ansArray.length > 0 ? Number((totalTime / ansArray.length).toFixed(1)) : 0;

    let maxStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < room.questions.length; i++) {
      if (player.answers[i]?.isCorrect) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    return { correct, wrong, avgTime, maxStreak };
  };

  const myStats = calculatePlayerStats(me);
  const oppStats = calculatePlayerStats(opponent);

  const handleRequestRematch = async () => {
    setRematchLoading(true);
    await realtimeService.requestRematch(room.id, currentUserId);
    setRematchLoading(false);
  };

  const hasMyRematchVote = room.rematchVotes.includes(currentUserId);
  const hasOpponentRematchVote = opponent ? room.rematchVotes.includes(opponent.id) : false;

  return (
    <div className="space-y-4 animate-fade-in pb-12 select-none">
      
      {/* Winner Hero Card */}
      <div className="flutter-card p-5 text-center space-y-3 border-2 border-amber-500/50">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <Trophy className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          {isDraw ? (
            <h1 className="text-lg font-bold text-amber-300">تعادل ملحمي بين المتسابقين! 🤝</h1>
          ) : (
            <>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">بطل المواجهة المباشرة</span>
              <h1 className="text-xl font-black text-slate-100 font-['Alexandria',sans-serif] mt-0.5">
                الفائز: <span className="text-amber-300">{winnerPlayer?.name}</span> 👑
              </h1>
            </>
          )}
        </div>

        {/* Clear Opponent Outcome Badge */}
        {isWinner ? (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center justify-center gap-1.5 mt-2 shadow-lg">
            <span>💀 الخصم ({opponent?.name}) خسر المواجهة 1v1!</span>
          </div>
        ) : !isDraw ? (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 mt-2">
            <span>🏆 فاز الخصم ({opponent?.name}) بالمواجهة</span>
          </div>
        ) : null}

        {hasOpponentRematchVote && !hasMyRematchVote && (
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
            الخصم بانتظار موافقتك على إعادة المباراة!
          </div>
        )}
      </div>

      {/* Match Statistics Comparison Table */}
      <div className="flutter-card p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Award className="w-4 h-4 text-amber-400" /> تحليل المباراة
          </div>
          <span className="text-[10px] font-mono text-slate-400">{room.questions.length} سؤالاً</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          
          {/* Column Titles */}
          <div className="p-2 bg-slate-950 rounded-xl font-bold text-amber-400 border border-slate-800 flex items-center justify-center gap-1.5">
            {renderAvatarBadge(me?.avatar || 'av_crown', "w-5 h-5")}
            <span className="truncate">أنت</span>
          </div>

          <div className="p-2 bg-slate-950 rounded-xl font-bold text-slate-400 border border-slate-800 flex items-center justify-center">
            المؤشر
          </div>

          <div className="p-2 bg-slate-950 rounded-xl font-bold text-cyan-400 border border-slate-800 flex items-center justify-center gap-1.5">
            {renderAvatarBadge(opponent?.avatar || 'av_shield', "w-5 h-5")}
            <span className="truncate">{opponent?.name || 'الخصم'}</span>
          </div>

          {/* Score */}
          <div className="p-2 bg-slate-950/60 rounded-xl font-mono font-black text-amber-300">{me?.score || 0}</div>
          <div className="p-2 bg-slate-950/60 rounded-xl font-bold text-slate-300 flex items-center justify-center gap-1 text-[10px]">
            <Zap className="w-3 h-3 text-amber-400" /> النقاط
          </div>
          <div className="p-2 bg-slate-950/60 rounded-xl font-mono font-black text-cyan-300">{opponent?.score || 0}</div>

          {/* Correct */}
          <div className="p-2 bg-slate-950/60 rounded-xl font-mono font-bold text-emerald-400">{myStats.correct}</div>
          <div className="p-2 bg-slate-950/60 rounded-xl font-bold text-slate-300 flex items-center justify-center gap-1 text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> صحيحة
          </div>
          <div className="p-2 bg-slate-950/60 rounded-xl font-mono font-bold text-emerald-400">{oppStats.correct}</div>

          {/* Wrong */}
          <div className="p-2 bg-slate-950/60 rounded-xl font-mono font-bold text-rose-400">{myStats.wrong}</div>
          <div className="p-2 bg-slate-950/60 rounded-xl font-bold text-slate-300 flex items-center justify-center gap-1 text-[10px]">
            <XCircle className="w-3 h-3 text-rose-400" /> خاطئة
          </div>
          <div className="p-2 bg-slate-950/60 rounded-xl font-mono font-bold text-rose-400">{oppStats.wrong}</div>

          {/* Avg Time */}
          <div className="p-2 bg-slate-950/60 rounded-xl font-mono font-bold text-slate-200">{myStats.avgTime}ث</div>
          <div className="p-2 bg-slate-950/60 rounded-xl font-bold text-slate-300 flex items-center justify-center gap-1 text-[10px]">
            <Clock className="w-3 h-3 text-blue-400" /> السرعة
          </div>
          <div className="p-2 bg-slate-950/60 rounded-xl font-mono font-bold text-slate-200">{oppStats.avgTime}ث</div>

        </div>
      </div>

      {/* Flutter Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={handleRequestRematch}
          disabled={rematchLoading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 flutter-touch cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${rematchLoading ? 'animate-spin' : ''}`} />
          <span>{hasMyRematchVote ? 'تم طلب الإعادة (بانتظار الخصم)' : 'طلب إعادة المباراة 🔄'}</span>
        </button>

        <button
          onClick={onGoHome}
          className="w-full py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 flutter-touch cursor-pointer hover:bg-slate-800"
        >
          <Home className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>
      </div>

    </div>
  );
};
