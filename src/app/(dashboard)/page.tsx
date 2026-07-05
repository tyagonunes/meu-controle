import Link from "next/link";
import { getMonthlyReport } from "@/actions/reports";
import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatMonthYear, getCurrentYearMonth } from "@/lib/format";

export default async function DashboardPage() {
  const { year, month } = getCurrentYearMonth();
  const report = await getMonthlyReport(year, month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground capitalize">
          Resumo de {formatMonthYear(`${year}-${String(month).padStart(2, "0")}-01`)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total geral</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(report.grandTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contas fixas</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(report.fixedTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cartões</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(report.cardsTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gastos de terceiros nos meus cartões</CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
              {formatCurrency(report.othersOnMyCards)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturas por cartão</CardTitle>
            <CardDescription>Valores do mês atual</CardDescription>
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
                    <LinkButton variant="outline" size="sm" href={`/relatorios/fatura/${card.cardId}`}>
                      Fatura
                    </LinkButton>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por membro</CardTitle>
            <CardDescription>Total nos cartões este mês</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.memberBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma compra no mês
              </p>
            ) : (
              report.memberBreakdown.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="font-medium">
                    {member.name}
                    {member.isOwner && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Titular)
                      </span>
                    )}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(member.total)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <LinkButton href="/relatorios/mensal">Ver relatório completo</LinkButton>
        <LinkButton variant="outline" href="/cartoes">
          Gerenciar cartões
        </LinkButton>
      </div>
    </div>
  );
}
