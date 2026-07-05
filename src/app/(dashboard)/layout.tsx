import { getUser } from "@/actions/auth";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b px-4 md:gap-4 md:px-6">
          <MobileNav />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-sm font-medium md:hidden">Meu Controle</p>
            <p className="truncate text-xs text-muted-foreground md:text-sm">
              {user?.email}
            </p>
          </div>
          <ThemeToggle className="shrink-0 md:hidden" />
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
