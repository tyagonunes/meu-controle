import { cn } from "@/lib/utils";

type MobileListProps = {
  children: React.ReactNode;
  className?: string;
};

export const DesktopTableView = ({ children, className }: MobileListProps) => (
  <div className={cn("hidden rounded-lg border md:block", className)}>
    {children}
  </div>
);

export const MobileCardList = ({ children, className }: MobileListProps) => (
  <div className={cn("space-y-3 md:hidden", className)}>{children}</div>
);

export const MobileCard = ({ children, className }: MobileListProps) => (
  <div className={cn("rounded-lg border bg-card p-4", className)}>{children}</div>
);

type MobileCardHeaderProps = {
  title: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
};

export const MobileCardHeader = ({
  title,
  badge,
  className,
}: MobileCardHeaderProps) => (
  <div className={cn("flex items-start justify-between gap-2", className)}>
    <div className="min-w-0 font-medium leading-snug">{title}</div>
    {badge}
  </div>
);

export const MobileCardBody = ({ children, className }: MobileListProps) => (
  <div className={cn("mt-3 space-y-2", className)}>{children}</div>
);

type MobileCardRowProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export const MobileCardRow = ({ label, children, className }: MobileCardRowProps) => (
  <div className={cn("flex items-center justify-between gap-3 text-sm", className)}>
    <span className="shrink-0 text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{children}</span>
  </div>
);

export const MobileCardActions = ({ children, className }: MobileListProps) => (
  <div className={cn("mt-3 flex flex-wrap gap-2", className)}>{children}</div>
);

export const MobileEmptyState = ({ children, className }: MobileListProps) => (
  <div
    className={cn(
      "rounded-lg border p-6 text-center text-sm text-muted-foreground md:hidden",
      className
    )}
  >
    {children}
  </div>
);

type ListToolbarProps = {
  meta?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export const ListToolbar = ({ meta, children, className }: ListToolbarProps) => (
  <div
    className={cn(
      "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
      className
    )}
  >
    {meta}
    {children && <div className="flex flex-wrap gap-2">{children}</div>}
  </div>
);

export const TabsScrollArea = ({ children, className }: MobileListProps) => (
  <div className={cn("-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
    {children}
  </div>
);
