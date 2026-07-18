"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPurchase,
  deletePurchase,
  updatePurchase,
} from "@/actions/purchases";
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
  DesktopTableView,
  ListToolbar,
  MobileCard,
  MobileCardActions,
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
import { formatCurrency, formatDate } from "@/lib/format";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";
import type { CardMember, PurchaseWithMember } from "@/types/database";

type PurchasesListProps = {
  creditCardId: string;
  purchases: PurchaseWithMember[];
  members: CardMember[];
};

type PurchaseFormProps = {
  creditCardId: string;
  members: CardMember[];
  defaultMemberId: string;
  today: string;
  isPending: boolean;
  purchase?: PurchaseWithMember | null;
  onSubmit: (formData: FormData) => void;
};

const PurchaseForm = ({
  creditCardId,
  members,
  defaultMemberId,
  today,
  isPending,
  purchase,
  onSubmit,
}: PurchaseFormProps) => {
  const [isRecurring, setIsRecurring] = useState(purchase?.is_recurring ?? false);

  return (
    <form
      key={`purchase-${purchase?.id ?? "new"}-${members.length}-${isRecurring}`}
      action={onSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          name="description"
          required
          defaultValue={purchase?.description}
          placeholder="Ex: Netflix, Spotify, Academia"
        />
      </div>
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
          isRecurring && "border-primary bg-primary/5"
        )}
      >
        <input
          type="checkbox"
          name="is_recurring"
          value="true"
          checked={isRecurring}
          onChange={(event) => setIsRecurring(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
        />
        <div className="space-y-1">
          <p className="text-sm font-medium">Compra recorrente (mensal)</p>
          <p className="text-xs text-muted-foreground">
            Aparece na fatura todos os meses a partir da data de início
          </p>
        </div>
      </label>
      <div className={cn("grid gap-4", isRecurring ? "grid-cols-1" : "grid-cols-2")}>
        <div className="space-y-2">
          <Label htmlFor="total_amount">
            {isRecurring ? "Valor mensal (R$)" : "Valor total (R$)"}
          </Label>
          <Input
            id="total_amount"
            name="total_amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={purchase?.total_amount ?? ""}
          />
        </div>
        {!isRecurring && (
          <div className="space-y-2">
            <Label htmlFor="installments">Parcelas</Label>
            <Input
              id="installments"
              name="installments"
              type="number"
              min="1"
              defaultValue={purchase?.installments ?? 1}
              required
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="purchase_date">
          {isRecurring ? "Início da recorrência" : "Data da compra"}
        </Label>
        <Input
          id="purchase_date"
          name="purchase_date"
          type="date"
          defaultValue={purchase?.purchase_date ?? today}
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
          defaultValue={purchase?.card_member_id ?? defaultMemberId}
          placeholder="Selecione quem comprou"
          options={members.map((member) => ({
            value: member.id,
            label: member.name + (member.is_owner ? " (Titular)" : ""),
          }))}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? "Salvando..."
          : purchase
            ? "Salvar alterações"
            : isRecurring
              ? "Salvar recorrente"
              : "Salvar compra"}
      </Button>
    </form>
  );
};

export const PurchasesList = ({
  creditCardId,
  purchases,
  members,
}: PurchasesListProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseWithMember | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];
  const defaultMemberId =
    members.find((m) => m.is_owner)?.id ?? members[0]?.id ?? "";

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) setEditing(null);
  };

  const handleEdit = (purchase: PurchaseWithMember) => {
    setEditing(purchase);
    setOpen(true);
  };

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = editing
        ? await updatePurchase(editing.id, creditCardId, formData)
        : await createPurchase(creditCardId, formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Compra atualizada" : "Compra registrada");
      setOpen(false);
      setEditing(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string, isRecurring: boolean) => {
    const message = isRecurring
      ? "Deseja excluir esta compra recorrente? Ela deixará de aparecer nas faturas futuras."
      : "Deseja excluir esta compra?";

    if (!confirm(message)) return;

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
        <ListToolbar
          meta={
            <p className="text-sm text-muted-foreground">
              {purchases.length} compra(s) registrada(s)
            </p>
          }
        >
          <LinkButton
            variant="outline"
            size="sm"
            href={`/relatorios/fatura/${creditCardId}`}
          >
            Ver fatura
          </LinkButton>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  disabled={members.length === 0}
                  onClick={() => setEditing(null)}
                />
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova compra
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Editar compra" : "Registrar compra"}
                </DialogTitle>
              </DialogHeader>
              <PurchaseForm
                key={editing?.id ?? "new"}
                creditCardId={creditCardId}
                members={members}
                defaultMemberId={defaultMemberId}
                today={today}
                isPending={isPending}
                purchase={editing}
                onSubmit={handleSubmit}
              />
            </DialogContent>
          </Dialog>
        </ListToolbar>

        {members.length <= 1 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Adicione outros utilizadores (ex: cônjuge, filhos) acima para
            indicar quem fez cada compra nos relatórios.
          </p>
        )}

        {purchases.length === 0 ? (
          <>
            <MobileEmptyState>Nenhuma compra registrada</MobileEmptyState>
            <DesktopTableView>
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
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma compra registrada
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </DesktopTableView>
          </>
        ) : (
          <>
            <MobileCardList>
              {purchases.map((purchase) => (
                <MobileCard key={purchase.id}>
                  <MobileCardHeader
                    title={
                      <div className="flex flex-wrap items-center gap-2">
                        {purchase.description}
                        {purchase.is_recurring && (
                          <Badge variant="secondary" className="text-xs">
                            Recorrente
                          </Badge>
                        )}
                      </div>
                    }
                  />
                  <MobileCardBody>
                    <MobileCardRow label="Quem comprou">
                      {purchase.card_members.name}
                    </MobileCardRow>
                    <MobileCardRow label="Data">
                      {formatDate(purchase.purchase_date)}
                    </MobileCardRow>
                    <MobileCardRow label="Valor">
                      {formatCurrency(Number(purchase.total_amount))}
                      {purchase.is_recurring && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          /mês
                        </span>
                      )}
                    </MobileCardRow>
                    <MobileCardRow label="Parcelas">
                      {purchase.is_recurring
                        ? "Mensal"
                        : purchase.installments === 1
                          ? "À vista"
                          : `${purchase.installments}x`}
                    </MobileCardRow>
                  </MobileCardBody>
                  <MobileCardActions>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(purchase)}
                      disabled={isPending}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleDelete(purchase.id, purchase.is_recurring)
                      }
                      disabled={isPending}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Excluir
                    </Button>
                  </MobileCardActions>
                </MobileCard>
              ))}
            </MobileCardList>

            <DesktopTableView>
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
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {purchase.description}
                          {purchase.is_recurring && (
                            <Badge variant="secondary" className="text-xs">
                              Recorrente
                            </Badge>
                          )}
                        </div>
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
                        {purchase.is_recurring && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            /mês
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {purchase.is_recurring
                          ? "Mensal"
                          : purchase.installments === 1
                            ? "À vista"
                            : `${purchase.installments}x`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(purchase)}
                            disabled={isPending}
                            aria-label="Editar compra"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDelete(purchase.id, purchase.is_recurring)
                            }
                            disabled={isPending}
                            aria-label="Excluir compra"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DesktopTableView>
          </>
        )}
      </div>
    </div>
  );
};
