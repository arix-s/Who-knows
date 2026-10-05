import React, { useState } from 'react';
import { X, PlusCircle, Check, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../data/questionRepository';
import { realtimeService } from '../services/realtimeService';
import { LocalUserProfile } from '../utils/userProfile';
import { RoomState } from '../types/game';

interface CreateRoomBottomSheetProps {
  isOpen: boolean;
  initialCategory?: string;
  userProfile: LocalUserProfile;
  onClose: () => void;
  onRoomCreated: (room: RoomState) => void;
}

export const CreateRoomBottomSheet: React.FC<CreateRoomBottomSheetProps> = ({
  isOpen,
  initialCategory = 'all',
  userProfile,
  onClose,
  onRoomCreated
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const result = await realtimeService.createRoom(
      {
        id: userProfile.id,
        name: userProfile.name,
        avatar: userProfile.avatar
      },
      selectedCategory,
      questionCount,
      secondsPerQuestion
    );

    setLoading(false);

    if (result.error || !result.room) {
      setErrorMsg(result.error || 'فشل في إنشاء الغرفة.');
    } else {
      onRoomCreated(result.room);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-[480px] bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-['Alexandria',sans-serif]">إعدادات الغرفة الجديدة</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          
          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">التصنيف:</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between flutter-touch ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-xs truncate">{cat.name}</span>
                  {selectedCategory === cat.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">عدد الأسئلة:</label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-2 rounded-xl border text-center font-mono font-bold text-xs flutter-touch ${
                    questionCount === cnt
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {cnt} أسئلة
                </button>
              ))}
            </div>
          </div>

          {/* Time per Question */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">مهلة السؤال:</label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSecondsPerQuestion(sec)}
                  className={`py-2 rounded-xl border text-center font-mono font-bold text-xs flutter-touch ${
                    secondsPerQuestion === sec
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {sec}ث
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 flutter-touch cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الإنشاء...</span>
              </>
            ) : (
              <span>تأكيد وبدء الغرفة</span>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
