"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  createCardMember,
  deleteCardMember,
  updateCardMember,
} from "@/actions/card-members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CardMember } from "@/types/database";

type CardMembersInlineProps = {
  creditCardId: string;
  members: CardMember[];
};

export const CardMembersInline = ({
  creditCardId,
  members,
}: CardMembersInlineProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CardMember | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = editing
        ? await updateCardMember(editing.id, creditCardId, formData)
        : await createCardMember(creditCardId, formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Utilizador atualizado" : "Utilizador adicionado");
      setOpen(false);
      setEditing(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Deseja excluir "${name}"? Compras vinculadas impedem a exclusão.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCardMember(id, creditCardId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Utilizador excluído");
      router.refresh();
    });
  };

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Utilizadores do cartão</p>
          <p className="text-xs text-muted-foreground">
            Cadastre quem usa este cartão para indicar quem fez cada compra
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button size="sm" onClick={openCreate} />}>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar pessoa
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar utilizador" : "Novo utilizador do cartão"}
              </DialogTitle>
            </DialogHeader>
            <form
              key={`${editing?.id ?? "new"}-${open}`}
              action={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="member-name">Nome</Label>
                <Input
                  id="member-name"
                  name="name"
                  defaultValue={editing?.name}
                  required
                  placeholder="Ex: Esposa, Filho, Marido"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-1 rounded-full border bg-background py-1 pr-1 pl-3 text-sm"
          >
            <span>{member.name}</span>
            {member.is_owner && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Titular
              </Badge>
            )}
            {!member.is_owner && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setEditing(member);
                    setOpen(true);
                  }}
                  aria-label={`Editar ${member.name}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDelete(member.id, member.name)}
                  disabled={isPending}
                  aria-label={`Excluir ${member.name}`}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum utilizador cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
};

type AddMemberQuickDialogProps = {
  creditCardId: string;
  onAdded?: () => void;
};

export const AddMemberQuickDialog = ({
  creditCardId,
  onAdded,
}: AddMemberQuickDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createCardMember(creditCardId, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Utilizador adicionado");
      setOpen(false);
      router.refresh();
      onAdded?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="link" size="sm" className="h-auto p-0" />}>
        Cadastrar nova pessoa
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo utilizador do cartão</DialogTitle>
        </DialogHeader>
        <form
          key={`quick-${open}`}
          action={handleSubmit}
          className="space-y-4"
          onSubmit={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <Label htmlFor="quick-member-name">Nome</Label>
            <Input
              id="quick-member-name"
              name="name"
              required
              placeholder="Ex: Esposa, Filho"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
