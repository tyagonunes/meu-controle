"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createIncomeSource,
  deleteIncomeSource,
  updateIncomeSource,
} from "@/actions/income-sources";
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
import { incomeCategoryLabels, incomeTypeLabels } from "@/lib/format";
import type {
  IncomeCategory,
  IncomeSource,
  IncomeSourceType,
} from "@/types/database";

type IncomeSourcesAccountsProps = {
  sources: IncomeSource[];
};

const types: IncomeSourceType[] = ["fixed", "variable"];
const categories: IncomeCategory[] = [
  "salario",
  "freelance",
  "investimentos",
  "outros",
];

export const IncomeSourcesAccounts = ({ sources }: IncomeSourcesAccountsProps) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = editing
        ? await updateIncomeSource(editing.id, formData)
        : await createIncomeSource(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Fonte atualizada" : "Fonte criada");
      setOpen(false);
      setEditing(null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir esta fonte e todos os lançamentos?")) return;

    startTransition(async () => {
      const result = await deleteIncomeSource(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Fonte excluída");
    });
  };

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (source: IncomeSource) => {
    setEditing(source);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <ListToolbar
        meta={
          <p className="text-sm text-muted-foreground">
            Cadastre salário e outras fontes — o valor é lançado mês a mês
          </p>
        }
      >
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova fonte
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar fonte" : "Nova fonte de receita"}
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
                  placeholder="Ex: Salário CLT, Freelance, Aluguel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <FormSelect
                  name="type"
                  defaultValue={editing?.type ?? "fixed"}
                  options={types.map((type) => ({
                    value: type,
                    label: incomeTypeLabels[type],
                  }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <FormSelect
                  name="category"
                  defaultValue={editing?.category ?? "salario"}
                  options={categories.map((category) => ({
                    value: category,
                    label: incomeCategoryLabels[category],
                  }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_day">Dia habitual de recebimento</Label>
                <Input
                  id="expected_day"
                  name="expected_day"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={editing?.expected_day ?? 5}
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
      </ListToolbar>

      {sources.length === 0 ? (
        <MobileEmptyState>Nenhuma fonte cadastrada</MobileEmptyState>
      ) : (
        <MobileCardList>
          {sources.map((source) => (
            <MobileCard key={source.id}>
              <MobileCardHeader
                title={source.name}
                badge={
                  <Badge variant={source.is_active ? "default" : "secondary"}>
                    {source.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                }
              />
              <MobileCardBody>
                <MobileCardRow label="Tipo">
                  {incomeTypeLabels[source.type]}
                </MobileCardRow>
                <MobileCardRow label="Categoria">
                  {incomeCategoryLabels[source.category]}
                </MobileCardRow>
                <MobileCardRow label="Recebimento">
                  Dia {source.expected_day}
                </MobileCardRow>
              </MobileCardBody>
              <MobileCardActions>
                <Button variant="outline" size="sm" onClick={() => openEdit(source)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(source.id)}
                  disabled={isPending}
                >
                  Excluir
                </Button>
              </MobileCardActions>
            </MobileCard>
          ))}
        </MobileCardList>
      )}

      <DesktopTableView>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Recebimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma fonte cadastrada
                </TableCell>
              </TableRow>
            ) : (
              sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>{incomeTypeLabels[source.type]}</TableCell>
                  <TableCell>{incomeCategoryLabels[source.category]}</TableCell>
                  <TableCell>Dia {source.expected_day}</TableCell>
                  <TableCell>
                    <Badge variant={source.is_active ? "default" : "secondary"}>
                      {source.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(source)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(source.id)}
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
      </DesktopTableView>
    </div>
  );
};
