import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="h-[100dvh] w-full bg-[#04060a] text-slate-100 flex items-center justify-center p-0 overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-[480px] h-[100dvh] bg-[#070a12] border-x border-slate-800/60 shadow-2xl relative flex flex-col font-['Cairo',sans-serif] overflow-hidden">
        {children}
      </div>
    </div>
  );
};
