import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Swords, X } from 'lucide-react';

export interface ToastMessage {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface AppToastModalProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const AppToastModal: React.FC<AppToastModalProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 10 }}
          className="w-full max-w-sm bg-[#090d16] border-2 border-amber-500/40 rounded-3xl p-5 space-y-4 text-center shadow-2xl shadow-amber-500/20 relative overflow-hidden"
        >
          {/* Header Icon */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
              isError
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                : 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-amber-500/30'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-8 h-8" />
            ) : isSuccess ? (
              <Swords className="w-8 h-8 stroke-[2.5]" />
            ) : (
              <CheckCircle2 className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1 pt-1">
            <h3 className="text-lg font-black text-slate-100 font-['Alexandria',sans-serif]">
              {toast.title}
            </h3>
            <p className="text-xs font-bold text-slate-300 leading-relaxed">
              {toast.message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer flutter-touch active:scale-98 transition-transform mt-2"
          >
            <span>حسناً</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
