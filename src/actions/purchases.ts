"use server";

import { revalidatePath } from "next/cache";
import { generateInstallments, parsePurchaseDate } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import type {
  InstallmentWithDetails,
  PurchaseWithMember,
} from "@/types/database";

export const getPurchases = async (
  creditCardId: string
): Promise<PurchaseWithMember[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("*, card_members(name, is_owner)")
    .eq("credit_card_id", creditCardId)
    .order("purchase_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PurchaseWithMember[];
};

export const createPurchase = async (
  creditCardId: string,
  formData: FormData
) => {
  const supabase = await createClient();

  const { data: card, error: cardError } = await supabase
    .from("credit_cards")
    .select("closing_day")
    .eq("id", creditCardId)
    .single();

  if (cardError) return { error: cardError.message };

  const totalAmount = Number(formData.get("total_amount"));
  const installments = Number(formData.get("installments")) || 1;
  const purchaseDateStr = formData.get("purchase_date") as string;
  const purchaseDate = parsePurchaseDate(purchaseDateStr);

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      credit_card_id: creditCardId,
      card_member_id: formData.get("card_member_id") as string,
      description: formData.get("description") as string,
      total_amount: totalAmount,
      purchase_date: purchaseDateStr,
      installments,
    })
    .select()
    .single();

  if (purchaseError) return { error: purchaseError.message };

  const installmentDrafts = generateInstallments(
    totalAmount,
    installments,
    purchaseDate,
    card.closing_day
  );

  const { error: installmentsError } = await supabase
    .from("purchase_installments")
    .insert(
      installmentDrafts.map((draft) => ({
        purchase_id: purchase.id,
        credit_card_id: creditCardId,
        installment_number: draft.installment_number,
        amount: draft.amount,
        billing_month: draft.billing_month,
      }))
    );

  if (installmentsError) {
    await supabase.from("purchases").delete().eq("id", purchase.id);
    return { error: installmentsError.message };
  }

  revalidatePath(`/cartoes/${creditCardId}`);
  revalidatePath("/");
  revalidatePath("/relatorios/mensal");
  revalidatePath(`/relatorios/fatura/${creditCardId}`);
  return { success: true };
};

export const deletePurchase = async (id: string, creditCardId: string) => {
  const supabase = await createClient();
  const { error } = await supabase.from("purchases").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/cartoes/${creditCardId}`);
  revalidatePath("/");
  revalidatePath("/relatorios/mensal");
  revalidatePath(`/relatorios/fatura/${creditCardId}`);
  return { success: true };
};

export type InstallmentWithCard = InstallmentWithDetails & {
  credit_cards: { name: string };
};

export const getInstallmentsByMonth = async (
  creditCardId: string,
  billingMonth: string
): Promise<InstallmentWithDetails[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_installments")
    .select(
      "*, purchases(description, installments, purchase_date, card_members(name, is_owner))"
    )
    .eq("credit_card_id", creditCardId)
    .eq("billing_month", billingMonth)
    .order("amount", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as InstallmentWithDetails[];
};

export const getAllInstallmentsByMonth = async (
  billingMonth: string
): Promise<InstallmentWithCard[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_installments")
    .select(
      "*, credit_cards(name), purchases(description, card_members(name, is_owner))"
    )
    .eq("billing_month", billingMonth);

  if (error) throw new Error(error.message);
  return (data ?? []) as InstallmentWithCard[];
};

export const getCardInvoiceTotalByMonth = async (
  creditCardId: string,
  billingMonth: string
) => {
  const installments = await getInstallmentsByMonth(creditCardId, billingMonth);
  return installments.reduce((sum, item) => sum + Number(item.amount), 0);
};
