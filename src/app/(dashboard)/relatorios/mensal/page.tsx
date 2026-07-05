import { getMonthlyReport } from "@/actions/reports";
import { MonthPickerNav } from "@/components/relatorios/month-picker-nav";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatMonthYear,
  getCurrentYearMonth,
} from "@/lib/format";

type RelatorioMensalPageProps = {
  searchParams: Promise<{ ano?: string; mes?: string }>;
};

export default async function RelatorioMensalPage({
  searchParams,
}: RelatorioMensalPageProps) {
  const query = await searchParams;
  const current = getCurrentYearMonth();
  const year = query.ano ? Number(query.ano) : current.year;
  const month = query.mes ? Number(query.mes) : current.month;

  const report = await getMonthlyReport(year, month);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Relatório Mensal
          </h1>
          <p className="text-muted-foreground capitalize">
            {formatMonthYear(report.billingMonth)}
          </p>
        </div>
        <MonthPickerNav
          year={year}
          month={month}
          basePath="/relatorios/mensal"
        />
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
            <CardDescription>Terceiros nos meus cartões</CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
              {formatCurrency(report.othersOnMyCards)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por categoria</CardTitle>
          <CardDescription>
            Contas fixas e faturas de cada cartão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria / Cartão</TableHead>
                <TableHead className="text-right">Meu gasto</TableHead>
                <TableHead className="text-right">Terceiros</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.fixedExpenseBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell className="font-medium">
                    <Badge variant="secondary">Contas Fixas</Badge>
                  </TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right font-medium">—</TableCell>
                  <TableCell className="text-right">
                    <LinkButton
                      variant="outline"
                      size="sm"
                      href={`/contas-fixas?ano=${year}&mes=${month}`}
                    >
                      Lançar
                    </LinkButton>
                  </TableCell>
                </TableRow>
              ) : (
                report.fixedExpenseBreakdown.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {expense.categoryLabel}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <LinkButton
                        variant="outline"
                        size="sm"
                        href={`/contas-fixas?ano=${year}&mes=${month}`}
                      >
                        Ver
                      </LinkButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {report.cardTotals.map((card) => (
                <TableRow key={card.cardId}>
                  <TableCell className="font-medium">{card.cardName}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(card.ownerTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {card.othersTotal > 0
                      ? formatCurrency(card.othersTotal)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(card.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <LinkButton
                      variant="outline"
                      size="sm"
                      href={`/relatorios/fatura/${card.cardId}?ano=${year}&mes=${month}`}
                    >
                      Fatura
                    </LinkButton>
                  </TableCell>
                </TableRow>
              ))}
              {report.cardTotals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum cartão cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por membro nos cartões</CardTitle>
          <CardDescription>
            Total de cada pessoa em todos os cartões no mês
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.memberBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma compra nos cartões neste mês
            </p>
          ) : (
            report.memberBreakdown.map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.name}</span>
                  {member.isOwner ? (
                    <Badge variant="secondary">Titular</Badge>
                  ) : (
                    <Badge variant="outline">Familiar</Badge>
                  )}
                </div>
                <span className="font-semibold">
                  {formatCurrency(member.total)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
