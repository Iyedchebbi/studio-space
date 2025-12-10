import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ children, active, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
        ${active 
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}
      `}
    >
      {icon && <span className="w-3 h-3">{icon}</span>}
      {children}
    </button>
  );
};
