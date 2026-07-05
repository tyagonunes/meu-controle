"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createCreditCard, deleteCreditCard, updateCreditCard } from "@/actions/credit-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
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
import type { CreditCard } from "@/types/database";

type CreditCardsListProps = {
  cards: CreditCard[];
};

export const CreditCardsList = ({ cards }: CreditCardsListProps) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = editing
        ? await updateCreditCard(editing.id, formData)
        : await createCreditCard(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Cartão atualizado" : "Cartão criado");
      setOpen(false);
      setEditing(null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este cartão e todas as compras?")) return;

    startTransition(async () => {
      const result = await deleteCreditCard(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cartão excluído");
    });
  };

  return (
    <div className="space-y-4">
      <ListToolbar
        meta={
          <p className="text-sm text-muted-foreground">
            {cards.length} cartão(ões) cadastrado(s)
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
          <DialogTrigger render={<Button onClick={() => setEditing(null)} />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cartão
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar cartão" : "Novo cartão de crédito"}
              </DialogTitle>
            </DialogHeader>
            <form
              key={`${editing?.id ?? "new"}-${open}`}
              action={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nome do cartão</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editing?.name}
                  required
                  placeholder="Ex: Nubank, Itaú"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_digits">Últimos 4 dígitos</Label>
                <Input
                  id="last_digits"
                  name="last_digits"
                  maxLength={4}
                  defaultValue={editing?.last_digits ?? ""}
                  placeholder="1234"
                />
              </div>
              {!editing && (
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Seu nome no cartão</Label>
                  <Input
                    id="owner_name"
                    name="owner_name"
                    defaultValue="Eu"
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closing_day">Dia fechamento</Label>
                  <Input
                    id="closing_day"
                    name="closing_day"
                    type="number"
                    min="1"
                    max="31"
                    defaultValue={editing?.closing_day ?? 1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_day">Dia vencimento</Label>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Limite (opcional)</Label>
                <Input
                  id="credit_limit"
                  name="credit_limit"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.credit_limit ?? ""}
                />
              </div>
              {editing && (
                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <FormSelect
                    name="is_active"
                    defaultValue={editing.is_active ? "true" : "false"}
                    options={[
                      { value: "true", label: "Ativo" },
                      { value: "false", label: "Inativo" },
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

      {cards.length === 0 ? (
        <MobileEmptyState>Nenhum cartão cadastrado</MobileEmptyState>
      ) : (
        <MobileCardList>
          {cards.map((card) => (
            <MobileCard key={card.id}>
              <MobileCardHeader
                title={
                  <>
                    {card.name}
                    {card.last_digits && (
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        •••• {card.last_digits}
                      </span>
                    )}
                  </>
                }
                badge={
                  <Badge variant={card.is_active ? "default" : "secondary"}>
                    {card.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                }
              />
              <MobileCardBody>
                <MobileCardRow label="Fechamento">
                  Dia {card.closing_day}
                </MobileCardRow>
                <MobileCardRow label="Vencimento">
                  Dia {card.due_day}
                </MobileCardRow>
              </MobileCardBody>
              <MobileCardActions>
                <LinkButton variant="outline" size="sm" href={`/cartoes/${card.id}`}>
                  Abrir
                </LinkButton>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(card);
                    setOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(card.id)}
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
              <TableHead>Cartão</TableHead>
              <TableHead>Fechamento</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum cartão cadastrado
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <Link
                      href={`/cartoes/${card.id}`}
                      className="font-medium hover:underline"
                    >
                      {card.name}
                      {card.last_digits && (
                        <span className="ml-1 text-muted-foreground">
                          •••• {card.last_digits}
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>Dia {card.closing_day}</TableCell>
                  <TableCell>Dia {card.due_day}</TableCell>
                  <TableCell>
                    <Badge variant={card.is_active ? "default" : "secondary"}>
                      {card.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <LinkButton variant="outline" size="sm" href={`/cartoes/${card.id}`}>
                        Abrir
                      </LinkButton>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(card);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(card.id)}
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
