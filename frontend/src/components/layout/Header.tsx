import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, action }) => {
  const { user } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'RD';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 px-8 border-b border-stone-200/80 bg-stone-50/70 flex items-center justify-between backdrop-blur-xs sticky top-0 z-10">
      <div>
        <h1 className="text-base font-semibold text-stone-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-stone-500 font-normal">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {action}
        <div className="h-5 w-[1px] bg-stone-200 mx-1"></div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-stone-800 text-stone-200 text-xs flex items-center justify-center font-mono">
            {getInitials(user?.name)}
          </div>
          <span className="text-xs font-medium text-stone-700 hidden sm:inline">
            {user?.name ? user.name.split(' ')[0] : 'Researcher'}
          </span>
        </div>
      </div>
    </header>
  );
};
