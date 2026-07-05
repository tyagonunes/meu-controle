import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LinkButtonProps = VariantProps<typeof buttonVariants> & {
  href: string;
  className?: string;
  children: React.ReactNode;
};

export const LinkButton = ({
  href,
  variant,
  size,
  className,
  children,
}: LinkButtonProps) => {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </Link>
  );
};
