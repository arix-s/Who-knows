import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Swords, UserPlus, UserCheck, ShieldOff, AtSign, Clock, ShieldAlert } from 'lucide-react';
import { SocialUser } from '../types/social';
import { renderAvatarBadge } from '../utils/userProfile';
import { ConfirmationDialog } from './ConfirmationDialog';

interface PlayerProfileModalProps {
  isOpen: boolean;
  player: SocialUser | null;
  currentUserId: string;
  isFriend: boolean;
  isPendingOutgoing: boolean;
  isBlocked: boolean;
  onClose: () => void;
  onSendFriendRequest: (target: string) => void;
  onSendChallenge: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onBlockUser: (targetId: string) => void;
  onUnblockUser: (targetId: string) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  player,
  currentUserId,
  isFriend,
  isPendingOutgoing,
  isBlocked,
  onClose,
  onSendFriendRequest,
  onSendChallenge,
  onRemoveFriend,
  onBlockUser,
  onUnblockUser
}) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ open: false, title: '', message: '', action: () => {} });

  if (!isOpen || !player) return null;

  const isSelf = player.id === currentUserId;
  const totalGames = player.gamesPlayed || 0;
  const wins = player.wins || 0;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const handleUnfriendClick = () => {
    setConfirmDialog({
      open: true,
      title: 'إزالة الصديق',
      message: `هل أنت تأكيد من رغبتك في إزالة ${player.name} من قائمة الأصدقاء؟`,
      action: () => {
        onRemoveFriend(player.id);
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const handleBlockClick = () => {
    setConfirmDialog({
      open: true,
      title: 'حظر اللاعب',
      message: `عند حظر ${player.name}، لن يتمكن من مراسلتك أو إرسال تحديات لك وسيتم إزالته من أصدقائك.`,
      action: () => {
        onBlockUser(player.id);
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-5 space-y-4 text-center shadow-2xl relative overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 left-3.5 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Avatar & Online Status */}
            <div className="relative w-20 h-20 mx-auto pt-2">
              {renderAvatarBadge(player.avatar, "w-20 h-20")}
              <div
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  player.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                }`}
                title={player.isOnline ? 'متصل الآن' : 'غير متصل'}
              />
            </div>

            {/* Display Name & Username */}
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-100 font-['Alexandria',sans-serif]">{player.name}</h2>
              <p className="text-xs font-mono text-cyan-400 font-bold flex items-center justify-center gap-0.5">
                <AtSign className="w-3 h-3" />
                {player.username.replace(/^@/, '')}
              </p>

              <span
                className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  player.isOnline
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {player.isOnline ? 'متصل الآن 🟢' : 'غير متصل 🔴'}
              </span>
            </div>

            {/* Player Stats Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 block">المباريات</span>
                <span className="font-bold font-mono text-slate-100 text-sm">{totalGames}</span>
              </div>

              <div className="space-y-0.5 border-x border-slate-800">
                <span className="text-[10px] text-slate-400 block">الانتصارات</span>
                <span className="font-bold font-mono text-emerald-400 text-sm flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {wins}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 block">نسبة الفوز</span>
                <span className="font-bold font-mono text-amber-400 text-sm">{winRate}%</span>
              </div>
            </div>

            {/* Action Buttons for non-self */}
            {!isSelf && (
              <div className="space-y-2 pt-1">
                {isBlocked ? (
                  <button
                    onClick={() => onUnblockUser(player.id)}
                    className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer flutter-touch"
                  >
                    <ShieldOff className="w-4 h-4" />
                    <span>إلغاء الحظر</span>
                  </button>
                ) : (
                  <>
                    {/* Challenge Button if Friends */}
                    {isFriend && (
                      <button
                        onClick={() => {
                          onSendChallenge(player.id);
                          onClose();
                        }}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer flutter-touch"
                      >
                        <Swords className="w-4 h-4" />
                        <span>إرسال تحدي 1v1</span>
                      </button>
                    )}

                    {/* Friend Status Action */}
                    {!isFriend && !isPendingOutgoing && (
                      <button
                        onClick={() => onSendFriendRequest(player.username)}
                        className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer flutter-touch border border-emerald-500/30"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>إضافة صديق</span>
                      </button>
                    )}

                    {!isFriend && isPendingOutgoing && (
                      <div className="w-full py-3 rounded-2xl bg-slate-800/80 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/30">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>طلب الصداقة قيد الانتظار</span>
                      </div>
                    )}

                    {isFriend && (
                      <div className="w-full py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-500/20">
                        <UserCheck className="w-4 h-4" />
                        <span>أنتم أصدقاء</span>
                      </div>
                    )}

                    {/* Unfriend / Block Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {isFriend && (
                        <button
                          onClick={handleUnfriendClick}
                          className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer flutter-touch"
                        >
                          إزالة الصديق
                        </button>
                      )}

                      <button
                        onClick={handleBlockClick}
                        className={`py-2.5 rounded-2xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer flutter-touch ${
                          !isFriend ? 'col-span-2' : ''
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>حظر اللاعب</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="تأكيد"
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </>
  );
};
