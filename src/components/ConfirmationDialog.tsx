import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'إلغاء',
  isDangerous = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 space-y-4 text-center shadow-2xl relative overflow-hidden"
        >
          <button
            onClick={onCancel}
            className="absolute top-3.5 left-3.5 p-1 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800/60"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100 font-['Alexandria',sans-serif]">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={onConfirm}
              className={`py-3 rounded-2xl font-bold text-xs flex items-center justify-center cursor-pointer flutter-touch ${
                isDangerous
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              }`}
            >
              {confirmLabel}
            </button>

            <button
              onClick={onCancel}
              className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer flutter-touch"
            >
              {cancelLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
