import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Search,
  Check,
  Swords,
  ShieldAlert,
  UserCheck,
  Clock,
  User,
  ShieldOff,
  AtSign
} from 'lucide-react';
import {
  SocialStatePayload,
  SocialUser,
  FriendRequest
} from '../types/social';
import { renderAvatarBadge } from '../utils/userProfile';
import { ConfirmationDialog } from './ConfirmationDialog';

interface SocialHubBottomSheetProps {
  isOpen: boolean;
  currentUserId: string;
  socialState: SocialStatePayload;
  onClose: () => void;
  onSearchQuery: (query: string) => Promise<SocialUser[]>;
  onSendFriendRequest: (target: string) => Promise<{ success: boolean; error?: string }>;
  onRespondFriendRequest: (requestId: string, action: 'accept' | 'reject') => void;
  onCancelFriendRequest: (requestId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onBlockUser: (targetId: string) => void;
  onUnblockUser: (targetId: string) => void;
  onSendChallenge: (friendId: string) => void;
  onOpenPlayerProfile: (player: SocialUser) => void;
}

export const SocialHubBottomSheet: React.FC<SocialHubBottomSheetProps> = ({
  isOpen,
  currentUserId,
  socialState,
  onClose,
  onSearchQuery,
  onSendFriendRequest,
  onRespondFriendRequest,
  onCancelFriendRequest,
  onRemoveFriend,
  onBlockUser,
  onUnblockUser,
  onSendChallenge,
  onOpenPlayerProfile
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search' | 'blocked'>('friends');
  const [requestSubTab, setRequestSubTab] = useState<'incoming' | 'outgoing'>('incoming');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SocialUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');

  // Toast / Error banner
  const [actionError, setActionError] = useState('');

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ open: false, title: '', message: '', action: () => {} });

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchMsg('');
    const res = await onSearchQuery(searchQuery);
    setIsSearching(false);
    setSearchResults(res);
    if (res.length === 0) {
      setSearchMsg('لم يتم العثور على أي لاعب ينطبق عليه البحث');
    }
  };

  const handleSendRequestClick = async (target: string) => {
    setActionError('');
    const res = await onSendFriendRequest(target);
    if (!res.success) {
      setActionError(res.error || 'تعذر إرسال الطلب');
    }
  };

  const handleRemoveFriendClick = (f: SocialUser) => {
    setConfirmDialog({
      open: true,
      title: 'إزالة من الأصدقاء',
      message: `هل أنت تأكيد من إزالة ${f.name} من قائمة أصدقائك؟`,
      action: () => {
        onRemoveFriend(f.id);
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const handleBlockClick = (f: SocialUser) => {
    setConfirmDialog({
      open: true,
      title: 'حظر اللاعب',
      message: `عند حظر ${f.name}، لن يتمكن من إرسال طلبات أو تحديات وسيتم حذفه من أصدقائك.`,
      action: () => {
        onBlockUser(f.id);
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
        <div className="w-full max-w-[480px] bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] flex flex-col">
          
          {/* Handle Bar */}
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100 font-['Alexandria',sans-serif]">الأصدقاء والتواصل الاجتماعي</h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Error Banner */}
          {actionError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-bold">
              {actionError}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('friends')}
              className={`py-2 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'friends' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400'
              }`}
            >
              الأصدقاء ({socialState.friends.length})
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'requests' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400'
              }`}
            >
              الطلبات
              {socialState.incomingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-mono animate-bounce">
                  {socialState.incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'search' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400'
              }`}
            >
              البحث 🔍
            </button>

            <button
              onClick={() => setActiveTab('blocked')}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'blocked' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400'
              }`}
            >
              المحظورون
            </button>
          </div>

          {/* TAB 1: FRIENDS LIST */}
          {activeTab === 'friends' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {socialState.friends.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-slate-500">
                  <Users className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-xs font-semibold">ليس لديك أصدقاء مضافون بعد</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="text-xs text-amber-400 font-bold hover:underline cursor-pointer block mx-auto pt-1"
                  >
                    ابحث عن لاعبين لإضافتهم الآن 🔍
                  </button>
                </div>
              ) : (
                socialState.friends.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => onOpenPlayerProfile(f)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        {renderAvatarBadge(f.avatar, "w-10 h-10")}
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
                            f.isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 text-right">
                        <span className="text-xs font-bold text-slate-100 block truncate">{f.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-semibold block">{f.username}</span>
                        <span className="text-[9px] text-slate-400 block font-semibold">
                          {f.isOnline ? '🟢 متصل الآن' : '🔴 غير متصل'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onSendChallenge(f.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md cursor-pointer flutter-touch"
                        title="إرسال تحدي"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>تحدي</span>
                      </button>

                      <button
                        onClick={() => onOpenPlayerProfile(f)}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="الملف الشخصي"
                      >
                        <User className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRemoveFriendClick(f)}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="إزالة من الأصدقاء"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: FRIEND REQUESTS */}
          {activeTab === 'requests' && (
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Sub-tabs for incoming vs outgoing */}
              <div className="flex items-center justify-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
                <button
                  onClick={() => setRequestSubTab('incoming')}
                  className={`px-3 py-1 rounded-lg cursor-pointer ${
                    requestSubTab === 'incoming' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400'
                  }`}
                >
                  طلب واردة ({socialState.incomingRequests.length})
                </button>

                <button
                  onClick={() => setRequestSubTab('outgoing')}
                  className={`px-3 py-1 rounded-lg cursor-pointer ${
                    requestSubTab === 'outgoing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400'
                  }`}
                >
                  طلبات مرسلة ({socialState.outgoingRequests.length})
                </button>
              </div>

              {requestSubTab === 'incoming' ? (
                socialState.incomingRequests.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">لا توجد طلبات صداقة واردة حالياً</p>
                ) : (
                  socialState.incomingRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderAvatarBadge(req.senderAvatar, "w-10 h-10")}
                        <div className="min-w-0 text-right">
                          <span className="text-xs font-bold text-slate-100 block truncate">{req.senderName}</span>
                          <span className="text-[10px] text-cyan-400 font-mono font-semibold block">{req.senderUsername}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onRespondFriendRequest(req.id, 'accept')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer flutter-touch"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>قبول</span>
                        </button>

                        <button
                          onClick={() => onRespondFriendRequest(req.id, 'reject')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-[10px] cursor-pointer"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : socialState.outgoingRequests.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">لا توجد طلبات مرسلة</p>
              ) : (
                socialState.outgoingRequests.map((req) => (
                  <div key={req.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderAvatarBadge(req.receiverAvatar, "w-10 h-10")}
                      <div className="min-w-0 text-right">
                        <span className="text-xs font-bold text-slate-100 block truncate">{req.receiverName}</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-semibold block">{req.receiverUsername}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onCancelFriendRequest(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] cursor-pointer"
                    >
                      إلغاء الطلب
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SEARCH PLAYERS */}
          {activeTab === 'search' && (
            <div className="flex-1 overflow-y-auto space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-slate-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو اليوزر (@user)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-100 font-bold text-xs outline-none text-right"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer flutter-touch"
                >
                  {isSearching ? 'جاري...' : 'بحث'}
                </button>
              </form>

              {searchMsg && (
                <p className="text-center text-xs text-amber-400 py-4 font-semibold">{searchMsg}</p>
              )}

              <div className="space-y-2">
                {searchResults.map((user) => {
                  const isFriend = socialState.friends.some((f) => f.id === user.id);
                  const isPending = socialState.outgoingRequests.some((r) => r.receiverId === user.id);

                  return (
                    <div
                      key={user.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div
                        onClick={() => onOpenPlayerProfile(user)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                      >
                        {renderAvatarBadge(user.avatar, "w-10 h-10")}
                        <div className="min-w-0 text-right">
                          <span className="text-xs font-bold text-slate-100 block truncate">{user.name}</span>
                          <span className="text-[10px] text-cyan-400 font-mono font-semibold block">{user.username}</span>
                        </div>
                      </div>

                      {isFriend ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <UserCheck className="w-3.5 h-3.5" /> أصدقاء
                        </span>
                      ) : isPending ? (
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /> معلق
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequestClick(user.username)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer flutter-touch"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>إضافة صديق</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: BLOCKED USERS */}
          {activeTab === 'blocked' && (
            <div className="flex-1 overflow-y-auto space-y-2">
              {socialState.blockedUserIds.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">قائمة المحظورين فارغة</p>
              ) : (
                socialState.blockedUserIds.map((id) => (
                  <div key={id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">{id}</span>
                    <button
                      onClick={() => onUnblockUser(id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>إلغاء الحظر</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

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
