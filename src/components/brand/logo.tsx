import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
  showLabel?: boolean;
};

export const Logo = ({ size = 32, className, showLabel = false }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="Meu Controle"
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
      />
      {showLabel && (
        <span className="text-lg font-semibold tracking-tight">Meu Controle</span>
      )}
    </div>
  );
};
