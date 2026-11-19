import React from 'react';

/**
 * Botanical Flower Icon (Stylized cannabis inflorescence / flower with calyxes and amber pistils)
 */
export const BotanicalFlowerIcon: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = 'w-5 h-5 text-emerald-500', size = 20 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Central bud node */}
      <path d="M12 2C10.5 4.5 10 7.5 10 10.5C10 12.5 11 14 12 14C13 14 14 12.5 14 10.5C14 7.5 13.5 4.5 12 2Z" fill="currentColor" fillOpacity="0.2" />
      {/* Side calyx petals */}
      <path d="M8 8C6 9.5 5 12 5.5 14C6 16 8 16.5 9.5 15.5C10.5 14.8 11 13.5 11 12" />
      <path d="M16 8C18 9.5 19 12 18.5 14C18 16 16 16.5 14.5 15.5C13.5 14.8 13 13.5 13 12" />
      {/* Lower calyx bracts */}
      <path d="M7 16C5.5 17.5 6 19.5 7.5 20.5C9 21.5 11 20.5 11.5 19" />
      <path d="M17 16C18.5 17.5 18 19.5 16.5 20.5C15 21.5 13 20.5 12.5 19" />
      {/* Stem & trichome pistils */}
      <path d="M12 14V22" />
      <path d="M11 6C9.5 5 8.5 3 9 2" stroke="currentColor" strokeDasharray="1 1" />
      <path d="M13 6C14.5 5 15.5 3 15 2" stroke="currentColor" strokeDasharray="1 1" />
    </svg>
  );
};

/**
 * Botanical Flower Illustration (Stylized botanical flower banner element)
 */
export const BotanicalFlowerIllustration: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = 'text-emerald-400/20', size = 120 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="50" cy="50" r="12" fill="currentColor" fillOpacity="0.1" />
      {/* Calyx cluster */}
      <path d="M50 20 C42 30 42 42 50 48 C58 42 58 30 50 20 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M22 45 C32 40 42 45 46 52 C40 58 28 56 22 45 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M78 45 C68 40 58 45 54 52 C60 58 72 56 78 45 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M32 75 C38 64 48 64 52 56 C44 54 34 62 32 75 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M68 75 C62 64 52 64 48 56 C56 54 66 62 68 75 Z" fill="currentColor" fillOpacity="0.15" />
      {/* Amber curling stigmas / pistils */}
      <path d="M48 24 C44 14 38 12 36 8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M52 24 C56 14 62 12 64 8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M26 42 C16 38 12 32 8 30" stroke="currentColor" strokeWidth="1.5" />
      <path d="M74 42 C84 38 88 32 92 30" stroke="currentColor" strokeWidth="1.5" />
      <path d="M50 62 V88" strokeWidth="2" />
      {/* Trichome specks */}
      <circle cx="46" cy="34" r="1.5" fill="currentColor" />
      <circle cx="54" cy="34" r="1.5" fill="currentColor" />
      <circle cx="38" cy="48" r="1.5" fill="currentColor" />
      <circle cx="62" cy="48" r="1.5" fill="currentColor" />
      <circle cx="50" cy="44" r="1.5" fill="currentColor" />
    </svg>
  );
};

/**
 * Botanical Leaf Icon (Stylized cannabis / botanical leaf with fine organic veins)
 */
export const BotanicalLeafIcon: React.FC<{
  className?: string;
  size?: number;
  variant?: 'outline' | 'filled' | 'minimal';
}> = ({ className = 'w-5 h-5 text-emerald-600', size = 20, variant = 'filled' }) => {
  if (variant === 'minimal') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 22C12 22 4 17 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10C20 17 12 22 12 22Z" />
        <path d="M12 2V22" />
        <path d="M8 8L12 12L16 8" />
        <path d="M7 13L12 16L17 13" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
    >
      {/* Refined 7-point cannabis leaf silhouette */}
      <path
        d="M16 2C16.3 5.5 17.5 9 19 11.5C17.8 8.5 19.5 5 21 3.5C21.8 6.5 22.8 9.5 23.5 12C23 9.5 25 7.5 26.5 6.5C26.5 9.5 26.2 12.5 25.5 15C25 13 27 12 28.5 11.5C27.5 14.5 25.8 17.2 23.5 19.2C24.5 18 26.5 17.5 28 17.2C26.2 20 23.5 22 20.2 23.2C21.5 22.2 23 21.8 24.2 21.5C21.5 23.5 18.2 24.8 16.5 25.2V30H15.5V25.2C13.8 24.8 10.5 23.5 7.8 21.5C9 21.8 10.5 22.2 11.8 23.2C8.5 22 5.8 20 4 17.2C5.5 17.5 7.5 18 8.5 19.2C6.2 17.2 4.5 14.5 3.5 11.5C5 12 7 13 6.5 15C5.8 12.5 5.5 9.5 5.5 6.5C7 7.5 9 9.5 8.5 12C9.2 9.5 10.2 6.5 11 3.5C12.5 5 14.2 8.5 13 11.5C14.5 9 15.7 5.5 16 2Z"
        opacity="0.95"
      />
    </svg>
  );
};

/**
 * Botanical Watermark for card corners and section backgrounds
 */
export const BotanicalWatermark: React.FC<{
  className?: string;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'center';
  size?: number;
}> = ({
  className = 'text-emerald-800/6',
  position = 'top-right',
  size = 140,
}) => {
  const positionClasses = {
    'top-right': 'absolute -top-6 -right-6 pointer-events-none',
    'bottom-right': 'absolute -bottom-6 -right-6 pointer-events-none',
    'bottom-left': 'absolute -bottom-6 -left-6 pointer-events-none',
    'center': 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none',
  }[position];

  return (
    <div className={`${positionClasses} ${className} transition-opacity duration-500 select-none overflow-hidden`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="currentColor"
        className="transform rotate-12"
      >
        <path
          d="M50 8 C51 18 55 28 60 36 C56 26 62 16 67 12 C69 22 72 32 74 40 C73 32 79 26 84 23 C84 33 83 43 81 51 C79 44 86 41 90 39 C87 49 82 58 74 65 C78 61 84 59 89 58 C83 67 74 74 64 78 C68 75 73 73 77 72 C68 79 57 83 52 84 V100 H48 V84 C43 83 32 79 23 72 C27 73 32 75 36 78 C26 74 17 67 11 58 C16 59 22 61 26 65 C18 58 13 49 10 39 C14 41 21 44 19 51 C17 43 16 33 16 23 C21 26 27 32 26 40 C28 32 31 22 33 12 C38 16 44 26 40 36 C45 28 49 18 50 8 Z"
        />
      </svg>
    </div>
  );
};

/**
 * Botanical Badge / Pill with herbal drop or leaf icon
 */
export const BotanicalBadge: React.FC<{
  label: string;
  variant?: 'emerald' | 'amber' | 'teal' | 'slate';
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, variant = 'emerald', icon, className = '' }) => {
  const styles = {
    emerald: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80 shadow-xs',
    amber: 'bg-amber-50/90 text-amber-900 border-amber-200/80 shadow-xs',
    teal: 'bg-teal-50/90 text-teal-900 border-teal-200/80 shadow-xs',
    slate: 'bg-slate-100/90 text-slate-800 border-slate-200/80 shadow-xs',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-xs ${styles} ${className}`}
    >
      {icon || <BotanicalLeafIcon size={12} className="text-emerald-700" variant="minimal" />}
      <span>{label}</span>
    </span>
  );
};

/**
 * Botanical Section Header with subtle atmospheric glow and leaf motif
 */
export const BotanicalHero: React.FC<{
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: 'emerald' | 'amber' | 'teal';
  actionButton?: React.ReactNode;
  children?: React.ReactNode;
}> = ({
  title,
  subtitle,
  badge = 'Sanctuaire Bien-être & Réduction des Risques',
  badgeVariant = 'emerald',
  actionButton,
  children,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white p-6 sm:p-8 mb-6 shadow-xl border border-emerald-700/20">
      {/* Botanical watermark */}
      <BotanicalWatermark
        position="top-right"
        size={240}
        className="text-white/5"
      />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <BotanicalBadge
              label={badge}
              variant={badgeVariant}
              icon={<BotanicalLeafIcon size={13} className="text-emerald-400" />}
              className="bg-emerald-950/60 text-emerald-300 border-emerald-500/30 text-[11px]"
            />
            <span className="text-[10px] text-emerald-300/70 uppercase tracking-widest font-bold">
              Confidentialité RGPD Garantie
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>{title}</span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/85 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {actionButton && (
          <div className="shrink-0 flex items-center gap-3">
            {actionButton}
          </div>
        )}
      </div>

      {children && <div className="relative z-10 mt-6 pt-6 border-t border-white/10">{children}</div>}
    </div>
  );
};
