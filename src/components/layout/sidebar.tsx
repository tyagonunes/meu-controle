"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Banknote,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Wallet,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receitas", label: "Receitas", icon: Banknote },
  { href: "/contas-fixas", label: "Contas Fixas", icon: Wallet },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/relatorios/mensal", label: "Relatório Mensal", icon: Receipt },
];

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export const Sidebar = () => {
  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Logo size={28} showLabel />
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <NavLinks />
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
};

export const MobileNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon" className="shrink-0 md:hidden" />
        }
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[min(100vw-2rem,16rem)] flex-col p-0">
        <SheetHeader className="border-b p-6 text-left">
          <SheetTitle>
            <Logo size={28} showLabel />
          </SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto p-4">
          <NavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm text-muted-foreground">Tema</span>
              <ThemeToggle />
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
