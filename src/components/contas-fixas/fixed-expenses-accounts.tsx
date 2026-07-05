"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createFixedExpense,
  deleteFixedExpense,
  updateFixedExpense,
} from "@/actions/fixed-expenses";
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
import { categoryLabels } from "@/lib/format";
import type { FixedExpense, FixedExpenseCategory } from "@/types/database";

type FixedExpensesAccountsProps = {
  expenses: FixedExpense[];
};

const categories: FixedExpenseCategory[] = [
  "moradia",
  "utilidades",
  "financiamento",
  "outros",
];

export const FixedExpensesAccounts = ({ expenses }: FixedExpensesAccountsProps) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = editing
        ? await updateFixedExpense(editing.id, formData)
        : await createFixedExpense(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Conta atualizada" : "Conta criada");
      setOpen(false);
      setEditing(null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir esta conta e todos os lançamentos?")) return;

    startTransition(async () => {
      const result = await deleteFixedExpense(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Conta excluída");
    });
  };

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (expense: FixedExpense) => {
    setEditing(expense);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Cadastre suas contas — o valor é lançado mês a mês
        </p>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova conta
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar conta" : "Nova conta"}
              </DialogTitle>
            </DialogHeader>
            <form
              key={`${editing?.id ?? "new"}-${open}`}
              action={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editing?.name}
                  required
                  placeholder="Ex: Luz, Água, Financiamento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <FormSelect
                  name="category"
                  defaultValue={editing?.category ?? "utilidades"}
                  options={categories.map((cat) => ({
                    value: cat,
                    label: categoryLabels[cat],
                  }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_day">Dia de vencimento padrão</Label>
                <Input
                  id="due_day"
                  name="due_day"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={editing?.due_day ?? 10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                />
              </div>
              {editing && (
                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <FormSelect
                    name="is_active"
                    defaultValue={editing.is_active ? "true" : "false"}
                    options={[
                      { value: "true", label: "Ativa" },
                      { value: "false", label: "Inativa" },
                    ]}
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Vencimento padrão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma conta cadastrada
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.name}</TableCell>
                  <TableCell>{categoryLabels[expense.category]}</TableCell>
                  <TableCell>Dia {expense.due_day}</TableCell>
                  <TableCell>
                    <Badge variant={expense.is_active ? "default" : "secondary"}>
                      {expense.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(expense)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        disabled={isPending}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
