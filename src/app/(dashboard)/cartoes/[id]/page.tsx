import { notFound } from "next/navigation";
import { getCardMembers } from "@/actions/card-members";
import { getCreditCard } from "@/actions/credit-cards";
import { getPurchases } from "@/actions/purchases";
import { PurchasesList } from "@/components/cartoes/purchases-list";
import { LinkButton } from "@/components/ui/link-button";

type CartaoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CartaoDetailPage({ params }: CartaoDetailPageProps) {
  const { id } = await params;

  let card;
  try {
    card = await getCreditCard(id);
  } catch {
    notFound();
  }

  const [members, purchases] = await Promise.all([
    getCardMembers(id),
    getPurchases(id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{card.name}</h1>
          <p className="text-muted-foreground">
            Fechamento dia {card.closing_day} · Vencimento dia {card.due_day}
            {card.last_digits && ` · •••• ${card.last_digits}`}
          </p>
        </div>
        <LinkButton variant="outline" href={`/relatorios/fatura/${id}`}>
          Ver fatura mensal
        </LinkButton>
      </div>

      <PurchasesList
        creditCardId={id}
        purchases={purchases}
        members={members}
      />
    </div>
  );
}
