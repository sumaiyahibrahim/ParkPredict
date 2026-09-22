import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'available' | 'limited' | 'full' | 'recommended' | 'info' | 'neutral' | 'teal';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';

  if (variant === 'available') {
    colorClasses = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80';
  } else if (variant === 'limited') {
    colorClasses = 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80';
  } else if (variant === 'full') {
    colorClasses = 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80';
  } else if (variant === 'recommended') {
    colorClasses = 'bg-gradient-to-r from-teal-500/15 to-blue-500/15 text-teal-800 dark:text-teal-200 border border-teal-500/30 font-semibold';
  } else if (variant === 'info') {
    colorClasses = 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80';
  } else if (variant === 'teal') {
    colorClasses = 'bg-brandTeal/10 text-brandTeal dark:bg-brandTeal/20 dark:text-teal-300 border border-brandTeal/30 font-semibold';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full tracking-tight ${sizeClasses} ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
};
