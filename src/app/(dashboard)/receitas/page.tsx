import {
  checkIncomeEntriesTable,
  getIncomeSourcesWithEntries,
} from "@/actions/income-entries";
import { getIncomeSources } from "@/actions/income-sources";
import { IncomeEntriesList } from "@/components/receitas/income-entries-list";
import { IncomeMigrationRequired } from "@/components/receitas/income-migration-required";
import { IncomeSourcesAccounts } from "@/components/receitas/income-sources-accounts";
import { MonthPickerNav } from "@/components/relatorios/month-picker-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsScrollArea } from "@/components/ui/mobile-list";
import { formatMonthYear, getCurrentYearMonth } from "@/lib/format";

type ReceitasPageProps = {
  searchParams: Promise<{ ano?: string; mes?: string; aba?: string }>;
};

export default async function ReceitasPage({ searchParams }: ReceitasPageProps) {
  const query = await searchParams;
  const current = getCurrentYearMonth();
  const year = query.ano ? Number(query.ano) : current.year;
  const month = query.mes ? Number(query.mes) : current.month;
  const defaultTab = query.aba === "cadastro" ? "cadastro" : "lancamentos";

  const entriesTableReady = await checkIncomeEntriesTable();

  const [sources, sourcesWithEntries] = entriesTableReady
    ? await Promise.all([
        getIncomeSources(),
        getIncomeSourcesWithEntries(year, month),
      ])
    : [[], []];

  const billingMonth = `${year}-${String(month).padStart(2, "0")}-01`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receitas</h1>
          <p className="text-muted-foreground">
            Salário fixo mensal e outras fontes de renda variáveis
          </p>
        </div>
        <MonthPickerNav
          year={year}
          month={month}
          basePath="/receitas"
          extraParams={{ aba: defaultTab }}
        />
      </div>

      {!entriesTableReady && <IncomeMigrationRequired />}

      <Tabs defaultValue={defaultTab}>
        <TabsScrollArea>
          <TabsList className="min-w-max">
            <TabsTrigger value="lancamentos">
              Lançamentos — {formatMonthYear(billingMonth)}
            </TabsTrigger>
            <TabsTrigger value="cadastro">Cadastro de fontes</TabsTrigger>
          </TabsList>
        </TabsScrollArea>

        <TabsContent value="lancamentos" className="mt-4">
          {entriesTableReady ? (
            <IncomeEntriesList
              items={sourcesWithEntries}
              year={year}
              month={month}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Execute a migration no Supabase para habilitar os lançamentos de
              receita.
            </p>
          )}
        </TabsContent>

        <TabsContent value="cadastro" className="mt-4">
          <IncomeSourcesAccounts sources={sources} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
