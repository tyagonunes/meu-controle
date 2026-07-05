import { notFound } from "next/navigation";
import { getCreditCard } from "@/actions/credit-cards";
import { getInstallmentsByMonth } from "@/actions/purchases";
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
  DesktopTableView,
  MobileCard,
  MobileCardBody,
  MobileCardHeader,
  MobileCardList,
  MobileCardRow,
  MobileEmptyState,
} from "@/components/ui/mobile-list";
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
  formatDate,
  formatMonthYear,
  getCurrentYearMonth,
  toBillingMonthString,
} from "@/lib/format";

type FaturaPageProps = {
  params: Promise<{ cartaoId: string }>;
  searchParams: Promise<{ ano?: string; mes?: string }>;
};

export default async function FaturaPage({
  params,
  searchParams,
}: FaturaPageProps) {
  const { cartaoId } = await params;
  const query = await searchParams;
  const current = getCurrentYearMonth();
  const year = query.ano ? Number(query.ano) : current.year;
  const month = query.mes ? Number(query.mes) : current.month;
  const billingMonth = toBillingMonthString(year, month);

  let card;
  try {
    card = await getCreditCard(cartaoId);
  } catch {
    notFound();
  }

  const installments = await getInstallmentsByMonth(cartaoId, billingMonth);

  const total = installments.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const memberTotals = installments.reduce<
    Record<string, { name: string; isOwner: boolean; total: number }>
  >((acc, item) => {
    const member = item.purchases.card_members;
    if (!acc[member.name]) {
      acc[member.name] = {
        name: member.name,
        isOwner: member.is_owner,
        total: 0,
      };
    }
    acc[member.name].total += Number(item.amount);
    return acc;
  }, {});

  const sortedMembers = Object.values(memberTotals).sort(
    (a, b) => b.total - a.total
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Fatura — {card.name}
          </h1>
          <p className="text-muted-foreground capitalize">
            {formatMonthYear(billingMonth)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPickerNav
            year={year}
            month={month}
            basePath={`/relatorios/fatura/${cartaoId}`}
          />
          <LinkButton variant="outline" href={`/cartoes/${cartaoId}`}>
            Voltar ao cartão
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total da fatura</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(total)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compras na fatura</CardDescription>
            <CardTitle className="text-2xl">{installments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Membros com gastos</CardDescription>
            <CardTitle className="text-2xl">{sortedMembers.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total por membro</CardTitle>
          <CardDescription>
            Quanto cada pessoa gastou nesta fatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma compra nesta fatura
            </p>
          ) : (
            sortedMembers.map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.name}</span>
                  {member.isOwner && (
                    <Badge variant="secondary">Titular</Badge>
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

      {installments.length === 0 ? (
        <>
          <MobileEmptyState>Nenhuma parcela nesta fatura</MobileEmptyState>
          <DesktopTableView>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead>Data compra</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma parcela nesta fatura
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DesktopTableView>
        </>
      ) : (
        <>
          <MobileCardList>
            {installments.map((item) => (
              <MobileCard key={item.id}>
                <MobileCardHeader title={item.purchases.description} />
                <MobileCardBody>
                  <MobileCardRow label="Membro">
                    {item.purchases.card_members.name}
                  </MobileCardRow>
                  <MobileCardRow label="Data">
                    {formatDate(item.purchases.purchase_date)}
                  </MobileCardRow>
                  <MobileCardRow label="Parcela">
                    {item.purchases.is_recurring
                      ? `Mensal (${item.installment_number})`
                      : item.purchases.installments === 1
                        ? "À vista"
                        : `${item.installment_number}/${item.purchases.installments}`}
                  </MobileCardRow>
                  <MobileCardRow label="Valor">
                    {formatCurrency(Number(item.amount))}
                  </MobileCardRow>
                </MobileCardBody>
              </MobileCard>
            ))}
          </MobileCardList>

          <DesktopTableView>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead>Data compra</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.purchases.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.purchases.card_members.name}
                        {item.purchases.card_members.is_owner && (
                          <Badge variant="outline" className="text-xs">
                            Titular
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(item.purchases.purchase_date)}
                    </TableCell>
                    <TableCell>
                      {item.purchases.is_recurring
                        ? `Mensal (${item.installment_number})`
                        : item.purchases.installments === 1
                          ? "À vista"
                          : `${item.installment_number}/${item.purchases.installments}`}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(item.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DesktopTableView>
        </>
      )}
    </div>
  );
}
