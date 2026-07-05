import Link from "next/link";
import { getMonthlyReport } from "@/actions/reports";
import { DashboardMonthNav } from "@/components/dashboard/dashboard-month-nav";
import { MonthlySpendingSummary } from "@/components/dashboard/monthly-spending-summary";
import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatMonthYear,
  getCurrentYearMonth,
  isDashboardAllowedMonth,
  toBillingMonthString,
} from "@/lib/format";

type DashboardPageProps = {
  searchParams: Promise<{ ano?: string; mes?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const query = await searchParams;
  const current = getCurrentYearMonth();
  const requestedYear = query.ano ? Number(query.ano) : current.year;
  const requestedMonth = query.mes ? Number(query.mes) : current.month;
  const year = isDashboardAllowedMonth(requestedYear, requestedMonth)
    ? requestedYear
    : current.year;
  const month = isDashboardAllowedMonth(requestedYear, requestedMonth)
    ? requestedMonth
    : current.month;

  const report = await getMonthlyReport(year, month);
  const billingMonth = toBillingMonthString(year, month);
  const isCurrentMonth =
    year === current.year && month === current.month;

  const balancePositive = report.remainingBalance >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground capitalize">
            Resumo de {formatMonthYear(billingMonth)}
          </p>
        </div>
        <DashboardMonthNav year={year} month={month} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Receitas do mês</CardDescription>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
              {formatCurrency(report.incomeTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Minhas despesas</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(report.myExpensesTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo restante</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl",
                balancePositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              )}
            >
              {formatCurrency(report.remainingBalance)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <MonthlySpendingSummary
        expensesTotal={report.expensesTotal}
        myExpensesTotal={report.myExpensesTotal}
        othersOnMyCards={report.othersOnMyCards}
        fixedTotal={report.fixedTotal}
        ownerCardsTotal={report.ownerCardsTotal}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas do mês</CardTitle>
            <CardDescription>Fontes lançadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.incomeBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma receita lançada —{" "}
                <Link href="/receitas" className="underline underline-offset-4">
                  lançar receitas
                </Link>
              </p>
            ) : (
              report.incomeBreakdown.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{income.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {income.categoryLabel}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(income.amount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faturas por cartão</CardTitle>
            <CardDescription>
              {isCurrentMonth
                ? "Valores do mês atual"
                : `Valores de ${formatMonthYear(billingMonth)}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.cardTotals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cartão cadastrado
              </p>
            ) : (
              report.cardTotals.map((card) => (
                <div
                  key={card.cardId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{card.cardName}</p>
                    {card.othersTotal > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Terceiros: {formatCurrency(card.othersTotal)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatCurrency(card.total)}
                    </span>
                    <LinkButton
                      variant="outline"
                      size="sm"
                      href={`/relatorios/fatura/${card.cardId}?ano=${year}&mes=${month}`}
                    >
                      Fatura
                    </LinkButton>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <LinkButton href={`/relatorios/mensal?ano=${year}&mes=${month}`}>
          Ver relatório completo
        </LinkButton>
        <LinkButton variant="outline" href="/receitas">
          Gerenciar receitas
        </LinkButton>
        <LinkButton variant="outline" href="/cartoes">
          Gerenciar cartões
        </LinkButton>
      </div>
    </div>
  );
}
