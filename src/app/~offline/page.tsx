import { Logo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/link-button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo size={64} />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Você está offline</h1>
        <p className="max-w-sm text-muted-foreground">
          Não foi possível carregar esta página. Verifique sua conexão e tente
          novamente.
        </p>
      </div>
      <LinkButton href="/">Tentar novamente</LinkButton>
    </main>
  );
}
