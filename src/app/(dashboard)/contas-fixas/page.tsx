import {
  checkFixedExpenseEntriesTable,
  getFixedExpensesWithEntries,
} from "@/actions/fixed-expense-entries";
import { getFixedExpenses } from "@/actions/fixed-expenses";
import { FixedExpenseEntriesList } from "@/components/contas-fixas/fixed-expense-entries-list";
import { FixedExpensesAccounts } from "@/components/contas-fixas/fixed-expenses-accounts";
import { MigrationRequired } from "@/components/contas-fixas/migration-required";
import { MonthPickerNav } from "@/components/relatorios/month-picker-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMonthYear, getCurrentYearMonth } from "@/lib/format";

type ContasFixasPageProps = {
  searchParams: Promise<{ ano?: string; mes?: string; aba?: string }>;
};

export default async function ContasFixasPage({
  searchParams,
}: ContasFixasPageProps) {
  const query = await searchParams;
  const current = getCurrentYearMonth();
  const year = query.ano ? Number(query.ano) : current.year;
  const month = query.mes ? Number(query.mes) : current.month;
  const defaultTab = query.aba === "cadastro" ? "cadastro" : "lancamentos";

  const [expenses, entriesTableReady, expensesWithEntries] = await Promise.all([
    getFixedExpenses(),
    checkFixedExpenseEntriesTable(),
    getFixedExpensesWithEntries(year, month),
  ]);

  const billingMonth = `${year}-${String(month).padStart(2, "0")}-01`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas Fixas</h1>
          <p className="text-muted-foreground">
            Lançamentos mensais de luz, água, financiamento e outras despesas
          </p>
        </div>
        <MonthPickerNav
          year={year}
          month={month}
          basePath="/contas-fixas"
          extraParams={{ aba: defaultTab }}
        />
      </div>

      {!entriesTableReady && <MigrationRequired />}

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="lancamentos">
            Lançamentos — {formatMonthYear(billingMonth)}
          </TabsTrigger>
          <TabsTrigger value="cadastro">Cadastro de contas</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="mt-4">
          {entriesTableReady ? (
            <FixedExpenseEntriesList
              items={expensesWithEntries}
              year={year}
              month={month}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Execute a migration no Supabase para habilitar os lançamentos mensais.
            </p>
          )}
        </TabsContent>

        <TabsContent value="cadastro" className="mt-4">
          <FixedExpensesAccounts expenses={expenses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
