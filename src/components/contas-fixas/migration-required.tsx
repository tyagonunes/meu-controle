import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const MigrationRequired = () => {
  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader>
        <CardTitle>Migration pendente no Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          A tabela <code className="text-foreground">fixed_expense_entries</code>{" "}
          ainda não existe no banco. Execute a migration no SQL Editor do Supabase:
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Abra o dashboard do Supabase → SQL Editor</li>
          <li>Cole o conteúdo de <code className="text-foreground">supabase/migrations/002_fixed_expense_monthly_entries.sql</code></li>
          <li>Clique em Run</li>
          <li>Recarregue esta página</li>
        </ol>
      </CardContent>
    </Card>
  );
};
