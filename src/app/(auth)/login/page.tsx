import { AuthForm } from "@/components/auth/auth-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <AuthForm />
    </main>
  );
}
