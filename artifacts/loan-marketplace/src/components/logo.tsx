interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  variant?: "default" | "light";
}

export function Logo({ size = 32, withWordmark = true, className = "", variant = "default" }: LogoProps) {
  const wordmarkColor = variant === "light" ? "text-white" : "text-foreground";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className={`font-bold tracking-tight ${wordmarkColor}`} style={{ fontSize: size * 0.7 }}>
          Quikkk
        </span>
      )}
    </div>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Quikkk logo"
    >
      <defs>
        <linearGradient id="quikkk-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#111111" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="quikkk-bolt" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#quikkk-grad)" />
      <path
        d="M22 8 L11 22 H19 L17 32 L29 17 H21 L22 8 Z"
        fill="url(#quikkk-bolt)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
