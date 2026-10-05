import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Flame, Snowflake, Users, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { RoomState } from '../types/game';
import { renderAvatarBadge } from '../utils/userProfile';
import { realtimeService } from '../services/realtimeService';
import { soundFx } from '../utils/audio';

interface MatchScreenAppViewProps {
  room: RoomState;
  currentUserId: string;
  onLeaveRoom: () => void;
}

export const MatchScreenAppView: React.FC<MatchScreenAppViewProps> = ({
  room,
  currentUserId,
  onLeaveRoom
}) => {
  const [now, setNow] = useState(Date.now());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [audienceModalOpen, setAudienceModalOpen] = useState(false);

  // Sound repetition prevention refs
  const playedRevealAudioRef = useRef<string | null>(null);
  const playedTickSecondsRef = useRef<number | null>(null);

  const isHost = room.host.id === currentUserId;
  const me = isHost ? room.host : room.guest!;
  const opponent = isHost ? room.guest : room.host;

  const currentQIndex = room.currentQuestionIndex;
  const currentQ = room.questions[currentQIndex];

  // Sync answers
  const myAnswer = me?.answers[currentQIndex];
  const opponentAnswer = opponent?.answers[currentQIndex];

  // Removed choices by 50:50
  const removedOptions = room.removedOptionsMap?.[`${currentUserId}-${currentQIndex}`] || [];

  // Audience poll
  const audiencePoll = room.audiencePollMap?.[`${currentUserId}-${currentQIndex}`];

  // Timer Tick Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Timer calculations
  const elapsedMs = Math.max(0, now - room.questionStartTime);
  const remainingMs = Math.max(0, room.questionDurationMs - elapsedMs);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progressPercent = Math.min(100, Math.max(0, (remainingMs / room.questionDurationMs) * 100));

  // Audio tick under 5s - Guaranteed single trigger per second!
  useEffect(() => {
    if (room.status === 'playing' && remainingSeconds <= 5 && remainingSeconds > 0) {
      if (playedTickSecondsRef.current !== remainingSeconds) {
        playedTickSecondsRef.current = remainingSeconds;
        soundFx.playTick();
      }
    }
  }, [remainingSeconds, room.status]);

  // Audio trigger on REVEAL - Guaranteed single trigger per question!
  useEffect(() => {
    if (room.status === 'round_result') {
      const audioKey = `${currentQIndex}-${room.status}`;
      if (playedRevealAudioRef.current !== audioKey) {
        playedRevealAudioRef.current = audioKey;
        if (myAnswer?.isCorrect) {
          soundFx.playCorrect();
        } else if (myAnswer) {
          soundFx.playWrong();
        }
      }
    }
  }, [room.status, currentQIndex, myAnswer]);

  const handleSelectOption = async (opt: string) => {
    if (room.status !== 'playing' || myAnswer || removedOptions.includes(opt)) return;

    setSelectedOption(opt);
    soundFx.playOptionSelect();

    await realtimeService.submitAnswer(room.id, currentUserId, currentQIndex, opt);
  };

  const handleUseLifeline = async (type: 'fiftyFifty' | 'audience' | 'freeze') => {
    if (room.status !== 'playing' || me.lifelines[`${type}Used` as keyof typeof me.lifelines]) return;

    soundFx.playLifeline();
    const result = await realtimeService.useLifeline(room.id, currentUserId, type);

    if (type === 'audience' && result.payload) {
      setAudienceModalOpen(true);
    }
  };

  const OPTION_PREFIXES = ['أ', 'ب', 'ج', 'د'];

  return (
    <div className="space-y-3.5 animate-fade-in pb-10 select-none">
      
      {/* Top Mobile Bar HUD */}
      <div className="flutter-card p-3 space-y-2.5">
        
        {/* Progress & Category Row */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400"
          >
            <ArrowRight className="w-3.5 h-3.5" /> انسحاب
          </button>

          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
            سؤال {currentQIndex + 1} / {room.questionCount}
          </span>

          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
            currentQ?.difficulty === 'سهل'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : currentQ?.difficulty === 'صعب'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            {currentQ?.difficulty}
          </span>
        </div>

        {/* Players Scoreboard Strip */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          
          {/* You */}
          <div className="p-2 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {renderAvatarBadge(me?.avatar || 'av_crown', "w-7 h-7")}
              <div className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-300 truncate">أنت</span>
                <span className="block text-xs font-black font-mono text-amber-400">{me?.score || 0}</span>
              </div>
            </div>

            {myAnswer ? (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                أجبت
              </span>
            ) : (
              <span className="text-[9px] text-slate-500 animate-pulse shrink-0">تفكر...</span>
            )}
          </div>

          {/* Opponent */}
          <div className={`p-2 rounded-xl bg-slate-950 border flex items-center justify-between gap-2 transition-colors ${
            room.status === 'round_result' && opponentAnswer?.isCorrect === false
              ? 'border-rose-500/60 bg-rose-950/20'
              : 'border-slate-800'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {renderAvatarBadge(opponent?.avatar || 'av_shield', "w-7 h-7")}
              <div className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-300 truncate">{opponent?.name || 'الخصم'}</span>
                <span className="block text-xs font-black font-mono text-cyan-400">{opponent?.score || 0}</span>
              </div>
            </div>

            {room.status === 'round_result' ? (
              opponentAnswer?.isCorrect ? (
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  ✓ أضاف نقطة
                </span>
              ) : (
                <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30 shrink-0 animate-pulse">
                  ❌ خسر الجولة
                </span>
              )
            ) : opponentAnswer ? (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                أجاب
              </span>
            ) : (
              <span className="text-[9px] text-slate-500 animate-pulse shrink-0">يفكر...</span>
            )}
          </div>

        </div>

        {/* Timer Bar */}
        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between text-[10px] font-mono font-bold">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> المهلة:
            </span>
            <span className={remainingSeconds <= 5 ? 'text-rose-400 font-extrabold animate-bounce' : 'text-amber-400'}>
              {remainingSeconds}ث
            </span>
          </div>

          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                remainingSeconds <= 5
                  ? 'bg-rose-500'
                  : remainingSeconds <= 10
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* Lifelines Strip */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => handleUseLifeline('fiftyFifty')}
          disabled={room.status !== 'playing' || me.lifelines.fiftyFiftyUsed}
          className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 flutter-touch cursor-pointer ${
            me.lifelines.fiftyFiftyUsed
              ? 'bg-slate-950 border-slate-800 text-slate-600 line-through opacity-40 cursor-not-allowed'
              : 'bg-slate-900 border-amber-500/30 text-amber-300 hover:border-amber-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>50:50</span>
        </button>

        <button
          onClick={() => handleUseLifeline('audience')}
          disabled={room.status !== 'playing' || me.lifelines.audienceUsed}
          className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 flutter-touch cursor-pointer ${
            me.lifelines.audienceUsed
              ? 'bg-slate-950 border-slate-800 text-slate-600 line-through opacity-40 cursor-not-allowed'
              : 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:border-cyan-400'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>الجمهور</span>
        </button>

        <button
          onClick={() => handleUseLifeline('freeze')}
          disabled={room.status !== 'playing' || me.lifelines.freezeUsed}
          className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 flutter-touch cursor-pointer ${
            me.lifelines.freezeUsed
              ? 'bg-slate-950 border-slate-800 text-slate-600 line-through opacity-40 cursor-not-allowed'
              : 'bg-slate-900 border-blue-500/30 text-blue-300 hover:border-blue-400'
          }`}
        >
          <Snowflake className="w-3.5 h-3.5 text-blue-400" />
          <span>+5ث</span>
        </button>
      </div>

      {/* Main Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="flutter-card p-4 space-y-4"
        >
          
          {/* Question Text */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/40 text-center min-h-[80px] flex items-center justify-center">
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed font-['Alexandria',sans-serif]">
              {currentQ?.question}
            </h2>
          </div>

          {/* 4 Mobile Answer Buttons */}
          <div className="space-y-2">
            {currentQ?.options.map((optionText, idx) => {
              const prefix = OPTION_PREFIXES[idx];
              const isRemoved = removedOptions.includes(optionText);
              const isMyChoice = myAnswer?.option === optionText || selectedOption === optionText;
              const isOpponentChoice = opponentAnswer?.option === optionText;
              const isCorrectAnswer = currentQ.correctAnswer === optionText;
              const isRevealPhase = room.status === 'round_result';

              let btnStyle = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-amber-500/40';

              if (isRemoved) {
                btnStyle = 'bg-slate-950/20 border-slate-900 text-slate-700 opacity-20 cursor-not-allowed line-through';
              } else if (isRevealPhase) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 font-bold animate-pulse';
                } else if (isMyChoice && !isCorrectAnswer) {
                  btnStyle = 'bg-rose-950/80 border-2 border-rose-500 text-rose-200 font-bold';
                } else {
                  btnStyle = 'bg-slate-950/30 border-slate-900 text-slate-600 opacity-40';
                }
              } else if (isMyChoice) {
                btnStyle = 'bg-amber-500/20 border-2 border-amber-400 text-amber-200 font-bold';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(optionText)}
                  disabled={room.status !== 'playing' || !!myAnswer || isRemoved}
                  className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between gap-2.5 flutter-touch cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                      {prefix}
                    </span>
                    <span className="text-xs font-bold truncate">{optionText}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isRevealPhase && isOpponentChoice && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        الخصم
                      </span>
                    )}

                    {isRevealPhase && isMyChoice && (
                      isCorrectAnswer ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reveal Feedback & Opponent Result Banner */}
          {room.status === 'round_result' && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 text-center text-xs font-bold space-y-1.5 shadow-xl">
              <div className="flex items-center justify-center gap-1.5">
                {myAnswer?.isCorrect ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> إجابتك صحيحة! (+{myAnswer.pointsEarned} نقطة)
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> إجابتك خاطئة! الإجابة الصحيحة: {currentQ.correctAnswer}
                  </span>
                )}
              </div>

              {/* Opponent Status Indicator */}
              <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-center gap-1.5">
                {opponentAnswer?.isCorrect ? (
                  <span className="text-emerald-300">✓ الخصم ({opponent?.name}) أجاب إجابة صحيحة (+{opponentAnswer.pointsEarned} نقطة)</span>
                ) : (
                  <span className="text-rose-400 font-black flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" /> 💀 الخصم ({opponent?.name}) خسر هذه الجولة!
                  </span>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Audience Poll Modal Sheet */}
      {audienceModalOpen && audiencePoll && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[480px] bg-slate-900 border-t sm:border border-cyan-500/40 rounded-t-3xl sm:rounded-3xl p-4 space-y-3">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                <Users className="w-4 h-4" /> استطلاع رأي الجمهور
              </span>
              <button
                onClick={() => setAudienceModalOpen(false)}
                className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded"
              >
                إغلاق
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {currentQ.options.map((opt, idx) => {
                const percent = audiencePoll.percentages[opt] || 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-200">
                      <span className="truncate">{OPTION_PREFIXES[idx]} - {opt}</span>
                      <span className="font-mono text-cyan-400">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
