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
        <header className="flex h-16 items-center gap-4 border-b px-4 md:px-6">
          <MobileNav />
          <div className="flex flex-1">
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <ThemeToggle className="md:hidden" />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
