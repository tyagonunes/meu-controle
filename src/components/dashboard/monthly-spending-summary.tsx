import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type MonthlySpendingSummaryProps = {
  expensesTotal: number;
  myExpensesTotal: number;
  othersOnMyCards: number;
  fixedTotal: number;
  ownerCardsTotal: number;
};

export const MonthlySpendingSummary = ({
  expensesTotal,
  myExpensesTotal,
  othersOnMyCards,
  fixedTotal,
  ownerCardsTotal,
}: MonthlySpendingSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gasto total do mês</CardTitle>
        <CardDescription>
          Visão geral dos seus gastos e dos terceiros nos seus cartões
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
          <span className="font-medium">Total geral</span>
          <span className="text-2xl font-bold tracking-tight">
            {formatCurrency(expensesTotal)}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Meus gastos</p>
              <p className="text-xs text-muted-foreground">
                Contas fixas: {formatCurrency(fixedTotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                Meus cartões: {formatCurrency(ownerCardsTotal)}
              </p>
            </div>
            <p className="mt-3 text-xl font-semibold">
              {formatCurrency(myExpensesTotal)}
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Gastos de outros</p>
              <p className="text-xs text-muted-foreground">
                Nos meus cartões — pago por eles
              </p>
            </div>
            <p className="mt-3 text-xl font-semibold text-amber-600 dark:text-amber-400">
              {formatCurrency(othersOnMyCards)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
