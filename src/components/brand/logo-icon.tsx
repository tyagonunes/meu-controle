import { cn } from "@/lib/utils";

type LogoIconProps = {
  size?: number;
  className?: string;
};

export const LogoIcon = ({ size = 32, className }: LogoIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={cn("shrink-0", className)}
    role="img"
    aria-label="Meu Controle"
  >
    <defs>
      <linearGradient
        id="mc-logo-bg"
        x1="96"
        y1="64"
        x2="416"
        y2="448"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#047857" />
        <stop offset="1" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="112" fill="url(#mc-logo-bg)" />
    <rect x="128" y="292" width="56" height="96" rx="14" fill="white" opacity="0.9" />
    <rect x="204" y="232" width="56" height="156" rx="14" fill="white" />
    <rect x="280" y="188" width="56" height="200" rx="14" fill="white" opacity="0.95" />
    <path
      d="M152 312 L228 244 L296 272 L360 176"
      stroke="white"
      strokeWidth="18"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="360" cy="176" r="28" fill="white" />
    <circle cx="360" cy="176" r="14" fill="#059669" />
  </svg>
);

type LogoProps = {
  size?: number;
  className?: string;
  showLabel?: boolean;
};

export const Logo = ({ size = 32, className, showLabel = false }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoIcon size={size} />
      {showLabel && (
        <span className="text-lg font-semibold tracking-tight">Meu Controle</span>
      )}
    </div>
  );
};
