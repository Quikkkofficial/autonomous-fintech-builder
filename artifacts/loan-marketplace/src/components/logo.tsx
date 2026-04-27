import logoUrl from "/quikkk-logo.png?url";

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "default" | "light";
}

export function Logo({ size = 36, className = "", variant = "default" }: LogoProps) {
  if (variant === "light") {
    return (
      <img
        src={logoUrl}
        alt="Quikkk"
        style={{ height: size }}
        className={`w-auto object-contain ${className}`}
      />
    );
  }
  return (
    <div
      className={`bg-black inline-flex items-center justify-center rounded-xl ${className}`}
      style={{ paddingInline: size * 0.45, paddingBlock: size * 0.28 }}
    >
      <img src={logoUrl} alt="Quikkk" style={{ height: size }} className="w-auto object-contain block" />
    </div>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Quikkk"
    >
      <rect x="0" y="0" width="64" height="64" rx="14" fill="#000" />
      <circle cx="32" cy="30" r="14" stroke="#fff" strokeWidth="5" fill="none" />
      <line x1="42" y1="40" x2="52" y2="50" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M34 21 L25 32 H31 L29 42 L40 28 H33 L34 21 Z" fill="#E11D48" />
    </svg>
  );
}
