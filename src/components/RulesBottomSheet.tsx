import React from 'react';
import { X, HelpCircle, Swords, Zap, Flame, Users, Snowflake, ShieldCheck } from 'lucide-react';

interface RulesBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesBottomSheet: React.FC<RulesBottomSheetProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-[480px] bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-['Alexandria',sans-serif]">قواعد وآلية اللعب 1v1</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          
          <div className="space-y-1">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5" /> 1. المواجهة المباشرة
            </h3>
            <p className="text-slate-400 text-[11px]">
              يتنافس لاعبان على نفس الأسئلة وبنفس الترتيب في الوقت الفعلي. تظهر النتيجة ونقاط السرعة فوراً بعد كل سؤال.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> 2. النقاط والسرعة
            </h3>
            <p className="text-slate-400 text-[11px]">
              الإجابة الصحيحة تمنحك <strong className="text-amber-400">1000 نقطة</strong> + مكافأة سرعة تصل إلى <strong className="text-emerald-400">+500 نقطة</strong>!
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 3. وسائل المساعدة
            </h3>

            <div className="space-y-1.5 text-[11px]">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>50:50:</strong> تحذف إجابتين خاطئتين مرة واحدة طوال المباراة.</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><strong>رأي الجمهور:</strong> تعرض استطلاع نسب الخيارات لمساعدتك.</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-blue-400 shrink-0" />
                <span><strong>تجميد (+5ث):</strong> تمنحك 5 ثوانٍ إضافية للخيارات.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
