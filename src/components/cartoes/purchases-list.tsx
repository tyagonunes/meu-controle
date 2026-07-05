"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPurchase, deletePurchase } from "@/actions/purchases";
import {
  AddMemberQuickDialog,
  CardMembersInline,
} from "@/components/cartoes/card-members-inline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { LinkButton } from "@/components/ui/link-button";
import type { CardMember, PurchaseWithMember } from "@/types/database";

type PurchasesListProps = {
  creditCardId: string;
  purchases: PurchaseWithMember[];
  members: CardMember[];
};

export const PurchasesList = ({
  creditCardId,
  purchases,
  members,
}: PurchasesListProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];
  const defaultMemberId =
    members.find((m) => m.is_owner)?.id ?? members[0]?.id ?? "";

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createPurchase(creditCardId, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Compra registrada");
      setOpen(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir esta compra?")) return;

    startTransition(async () => {
      const result = await deletePurchase(id, creditCardId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Compra excluída");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <CardMembersInline creditCardId={creditCardId} members={members} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {purchases.length} compra(s) registrada(s)
          </p>
          <div className="flex gap-2">
            <LinkButton
              variant="outline"
              size="sm"
              href={`/relatorios/fatura/${creditCardId}`}
            >
              Ver fatura
            </LinkButton>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={<Button size="sm" disabled={members.length === 0} />}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova compra
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar compra</DialogTitle>
                </DialogHeader>
                <form
                  key={`purchase-${creditCardId}-${open}-${members.length}`}
                  action={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input id="description" name="description" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_amount">Valor total (R$)</Label>
                      <Input
                        id="total_amount"
                        name="total_amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="installments">Parcelas</Label>
                      <Input
                        id="installments"
                        name="installments"
                        type="number"
                        min="1"
                        defaultValue={1}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Data da compra</Label>
                    <Input
                      id="purchase_date"
                      name="purchase_date"
                      type="date"
                      defaultValue={today}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="card_member_id">Quem comprou</Label>
                      <AddMemberQuickDialog creditCardId={creditCardId} />
                    </div>
                    <FormSelect
                      name="card_member_id"
                      defaultValue={defaultMemberId}
                      placeholder="Selecione quem comprou"
                      options={members.map((member) => ({
                        value: member.id,
                        label: member.name + (member.is_owner ? " (Titular)" : ""),
                      }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar compra"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {members.length <= 1 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Adicione outros utilizadores (ex: cônjuge, filhos) acima para
            indicar quem fez cada compra nos relatórios.
          </p>
        )}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Quem comprou</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma compra registrada
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      {purchase.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {purchase.card_members.name}
                        {purchase.card_members.is_owner && (
                          <Badge variant="outline" className="text-xs">
                            Titular
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                    <TableCell>
                      {formatCurrency(Number(purchase.total_amount))}
                    </TableCell>
                    <TableCell>
                      {purchase.installments === 1
                        ? "À vista"
                        : `${purchase.installments}x`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(purchase.id)}
                        disabled={isPending}
                        aria-label="Excluir compra"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
