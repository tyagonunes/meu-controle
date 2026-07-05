"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteFixedExpenseEntry,
  upsertFixedExpenseEntry,
} from "@/actions/fixed-expense-entries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { categoryLabels, formatCurrency } from "@/lib/format";
import type { FixedExpenseWithEntry } from "@/types/database";

type FixedExpenseEntriesListProps = {
  items: FixedExpenseWithEntry[];
  year: number;
  month: number;
};

type EntryFormProps = {
  item: FixedExpenseWithEntry;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
};

const EntryForm = ({ item, isPending, onSubmit }: EntryFormProps) => {
  const [amount, setAmount] = useState(
    item.entry?.amount != null ? String(item.entry.amount) : ""
  );

  const handleUsePreviousAmount = () => {
    if (!item.previousEntry) return;
    setAmount(String(item.previousEntry.amount));
  };

  return (
    <form action={onSubmit} className="space-y-4">
      {item.entry && (
        <input type="hidden" name="entry_id" value={item.entry.id} />
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          {item.previousEntry && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto shrink-0 p-0 text-xs"
              onClick={handleUsePreviousAmount}
            >
              Usar mês anterior (
              {formatCurrency(Number(item.previousEntry.amount))})
            </Button>
          )}
        </div>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
          placeholder="Ex: 189.50"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="due_day">Dia de vencimento</Label>
        <Input
          id="due_day"
          name="due_day"
          type="number"
          min="1"
          max="31"
          defaultValue={item.entry?.due_day ?? item.due_day}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Input
          id="notes"
          name="notes"
          defaultValue={item.entry?.notes ?? item.notes ?? ""}
          placeholder="Opcional"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar lançamento"}
      </Button>
    </form>
  );
};

export const FixedExpenseEntriesList = ({
  items,
  year,
  month,
}: FixedExpenseEntriesListProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FixedExpenseWithEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = items.reduce(
    (sum, item) => sum + Number(item.entry?.amount ?? 0),
    0
  );
  const launchedCount = items.filter((item) => item.entry).length;

  const handleOpen = (item: FixedExpenseWithEntry) => {
    setSelected(item);
    setOpen(true);
  };

  const handleSubmit = (formData: FormData) => {
    if (!selected) return;

    startTransition(async () => {
      const result = await upsertFixedExpenseEntry(
        selected.id,
        year,
        month,
        formData
      );

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(selected.entry ? "Lançamento atualizado" : "Lançamento criado");
      setOpen(false);
      setSelected(null);
    });
  };

  const handleDelete = (entryId: string) => {
    if (!confirm("Deseja excluir este lançamento?")) return;

    startTransition(async () => {
      const result = await deleteFixedExpenseEntry(entryId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Lançamento excluído");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {launchedCount} de {items.length} conta(s) lançada(s) · Total:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(total)}
          </span>
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Cadastre contas na aba &quot;Cadastro de contas&quot; para começar a
          lançar valores mensais.
        </div>
      ) : (
        <>
          <MobileCardList>
            {items.map((item) => (
              <MobileCard key={item.id}>
                <MobileCardHeader
                  title={item.name}
                  badge={
                    item.entry ? (
                      <Badge variant="default">Lançado</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )
                  }
                />
                <MobileCardBody>
                  <MobileCardRow label="Categoria">
                    {categoryLabels[item.category]}
                  </MobileCardRow>
                  <MobileCardRow label="Valor do mês">
                    {item.entry
                      ? formatCurrency(Number(item.entry.amount))
                      : "—"}
                  </MobileCardRow>
                  <MobileCardRow label="Vencimento">
                    {item.entry
                      ? `Dia ${item.entry.due_day}`
                      : `Dia ${item.due_day} (padrão)`}
                  </MobileCardRow>
                </MobileCardBody>
                <MobileCardActions>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpen(item)}
                    disabled={isPending}
                  >
                    {item.entry ? (
                      <>
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-3 w-3" />
                        Lançar
                      </>
                    )}
                  </Button>
                  {item.entry && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.entry!.id)}
                      disabled={isPending}
                      aria-label="Excluir lançamento"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </MobileCardActions>
              </MobileCard>
            ))}
          </MobileCardList>

          <DesktopTableView>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor do mês</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{categoryLabels[item.category]}</TableCell>
                    <TableCell>
                      {item.entry
                        ? formatCurrency(Number(item.entry.amount))
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {item.entry
                        ? `Dia ${item.entry.due_day}`
                        : `Dia ${item.due_day} (padrão)`}
                    </TableCell>
                    <TableCell>
                      {item.entry ? (
                        <Badge variant="default">Lançado</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpen(item)}
                          disabled={isPending}
                        >
                          {item.entry ? (
                            <>
                              <Pencil className="mr-1 h-3 w-3" />
                              Editar
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1 h-3 w-3" />
                              Lançar
                            </>
                          )}
                        </Button>
                        {item.entry && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.entry!.id)}
                            disabled={isPending}
                            aria-label="Excluir lançamento"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DesktopTableView>
        </>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected?.entry ? "Editar lançamento" : "Lançar conta"} —{" "}
              {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <EntryForm
              key={`${selected.id}-${selected.entry?.id ?? "new"}`}
              item={selected}
              isPending={isPending}
              onSubmit={handleSubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
