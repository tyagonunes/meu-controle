import { Badge } from "@/components/ui/badge";
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
  groupInstallmentsByPurchaseType,
  type InvoicePurchaseType,
} from "@/lib/billing";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InstallmentWithDetails } from "@/types/database";

const SECTION_LABELS: Record<InvoicePurchaseType, string> = {
  installment: "Compras parceladas",
  recurring: "Compras recorrentes",
  cash: "Compras à vista",
};

const SECTION_ORDER: InvoicePurchaseType[] = [
  "installment",
  "recurring",
  "cash",
];

const getInstallmentLabel = (item: InstallmentWithDetails) => {
  if (item.purchases.is_recurring) {
    return `Mensal (${item.installment_number})`;
  }

  if (item.purchases.installments === 1) {
    return "À vista";
  }

  return `${item.installment_number}/${item.purchases.installments}`;
};

type InvoiceInstallmentsListProps = {
  installments: InstallmentWithDetails[];
};

export const InvoiceInstallmentsList = ({
  installments,
}: InvoiceInstallmentsListProps) => {
  if (installments.length === 0) {
    return (
      <>
        <MobileEmptyState>Nenhuma compra nesta fatura</MobileEmptyState>
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
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma compra nesta fatura
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DesktopTableView>
      </>
    );
  }

  const groups = groupInstallmentsByPurchaseType(installments);

  return (
    <div className="space-y-8">
      {SECTION_ORDER.map((type) => {
        const items = groups[type];
        if (items.length === 0) return null;

        const subtotal = items.reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );

        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{SECTION_LABELS[type]}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {items.length}{" "}
                  {items.length === 1 ? "item" : "itens"}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>

            <MobileCardList>
              {items.map((item) => (
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
                      {getInstallmentLabel(item)}
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
                  {items.map((item) => (
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
                      <TableCell>{getInstallmentLabel(item)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(item.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DesktopTableView>
          </section>
        );
      })}
    </div>
  );
};
