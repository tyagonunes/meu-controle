import { getCreditCards } from "@/actions/credit-cards";
import { CreditCardsList } from "@/components/cartoes/credit-cards-list";

export default async function CartoesPage() {
  const cards = await getCreditCards();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cartões de Crédito</h1>
        <p className="text-muted-foreground">
          Gerencie cartões, membros e compras parceladas
        </p>
      </div>
      <CreditCardsList cards={cards} />
    </div>
  );
}
