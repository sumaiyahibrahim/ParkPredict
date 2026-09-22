import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 36, text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 44, text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 56, text: 'text-3xl', sub: 'text-sm' },
  };

  const dim = sizeMap[size];

  // Geometric Icon: P + location pin + predictive navigation path
  const IconSVG = (
    <svg
      width={dim.icon}
      height={dim.icon}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
      aria-label="ParkPredict Emblem"
    >
      <defs>
        {variant === 'monochrome' ? (
          <linearGradient id="monoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        ) : (
          <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0FAF9A" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        )}
        <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0FAF9A" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Rounded Geometric Shield */}
      <rect
        width="44"
        height="44"
        rx="12"
        className={
          variant === 'monochrome'
            ? 'fill-slate-900 dark:fill-slate-800'
            : 'fill-[#102A43] dark:fill-[#0F1B2C]'
        }
      />

      {/* Subtle background precision grid circle */}
      <circle cx="22" cy="22" r="15" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="2 2" />

      {/* The "P" combined with Location Pin loop */}
      <path
        d="M14 11h9a6.5 6.5 0 0 1 6.5 6.5c0 3.59-2.91 6.5-6.5 6.5h-5v9h-4V11z"
        fill={variant === 'monochrome' ? 'url(#monoGrad)' : 'url(#brandGrad)'}
        filter="url(#subtleGlow)"
      />

      {/* Pin Core Focal Point */}
      <circle cx="23" cy="17.5" r="2.8" fill="#FFFFFF" />

      {/* Predictive Forward Navigation Vector */}
      <path
        d="M24 24.5l8 9.5h-5l-5.5-6.5"
        stroke="#0FAF9A"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{IconSVG}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {IconSVG}
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className={`font-heading font-extrabold tracking-tight text-navy-800 dark:text-white ${dim.text}`}>
            Park<span className="text-brandTeal">Predict</span>
          </span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-brandTeal/10 text-brandTeal border border-brandTeal/20">
            Smart Mobility
          </span>
        </div>
        {showTagline && (
          <span className={`font-sans tracking-wide text-slate-500 dark:text-slate-400 font-medium ${dim.sub}`}>
            Park Smart. Travel Faster.
          </span>
        )}
      </div>
    </div>
  );
};
