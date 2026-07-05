"use server";

import { revalidatePath } from "next/cache";
import {
  generateInstallments,
  getRecurringInstallmentNumber,
  isRecurringActiveInMonth,
  parsePurchaseDate,
} from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import type {
  InstallmentWithDetails,
  PurchaseWithMember,
} from "@/types/database";

type RecurringPurchaseRow = PurchaseWithMember;

type RecurringPurchaseWithCard = RecurringPurchaseRow & {
  credit_cards: { name: string; closing_day: number };
};

const buildRecurringInstallment = (
  purchase: RecurringPurchaseRow,
  billingMonth: string,
  closingDay: number,
  cardName?: string
): InstallmentWithDetails => {
  const purchaseDate = parsePurchaseDate(purchase.purchase_date);

  return {
    id: `recurring-${purchase.id}-${billingMonth}`,
    purchase_id: purchase.id,
    credit_card_id: purchase.credit_card_id,
    installment_number: getRecurringInstallmentNumber(
      purchaseDate,
      closingDay,
      billingMonth
    ),
    amount: Number(purchase.total_amount),
    billing_month: billingMonth,
    created_at: purchase.created_at,
    purchases: {
      description: purchase.description,
      installments: purchase.installments,
      purchase_date: purchase.purchase_date,
      is_recurring: true,
      card_members: purchase.card_members,
    },
    ...(cardName ? { credit_cards: { name: cardName } } : {}),
  };
};

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

  const isRecurring = formData.get("is_recurring") === "true";
  const totalAmount = Number(formData.get("total_amount"));
  const installments = isRecurring
    ? 1
    : Number(formData.get("installments")) || 1;
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
      is_recurring: isRecurring,
    })
    .select()
    .single();

  if (purchaseError) return { error: purchaseError.message };

  if (!isRecurring) {
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

  const [{ data: card, error: cardError }, { data, error }, { data: recurring, error: recurringError }] =
    await Promise.all([
      supabase
        .from("credit_cards")
        .select("closing_day")
        .eq("id", creditCardId)
        .single(),
      supabase
        .from("purchase_installments")
        .select(
          "*, purchases(description, installments, purchase_date, is_recurring, card_members(name, is_owner))"
        )
        .eq("credit_card_id", creditCardId)
        .eq("billing_month", billingMonth),
      supabase
        .from("purchases")
        .select("*, card_members(name, is_owner)")
        .eq("credit_card_id", creditCardId)
        .eq("is_recurring", true),
    ]);

  if (cardError) throw new Error(cardError.message);
  if (error) throw new Error(error.message);
  if (recurringError) throw new Error(recurringError.message);

  const dbInstallments = (data ?? []) as InstallmentWithDetails[];

  const recurringInstallments = ((recurring ?? []) as RecurringPurchaseRow[])
    .filter((purchase) =>
      isRecurringActiveInMonth(
        parsePurchaseDate(purchase.purchase_date),
        card.closing_day,
        billingMonth
      )
    )
    .map((purchase) =>
      buildRecurringInstallment(purchase, billingMonth, card.closing_day)
    );

  return [...dbInstallments, ...recurringInstallments].sort(
    (a, b) => Number(b.amount) - Number(a.amount)
  );
};

export const getAllInstallmentsByMonth = async (
  billingMonth: string
): Promise<InstallmentWithCard[]> => {
  const supabase = await createClient();

  const [{ data, error }, { data: recurring, error: recurringError }] =
    await Promise.all([
      supabase
        .from("purchase_installments")
        .select(
          "*, credit_cards(name), purchases(description, installments, purchase_date, is_recurring, card_members(name, is_owner))"
        )
        .eq("billing_month", billingMonth),
      supabase
        .from("purchases")
        .select(
          "*, credit_cards(name, closing_day), card_members(name, is_owner)"
        )
        .eq("is_recurring", true),
    ]);

  if (error) throw new Error(error.message);
  if (recurringError) throw new Error(recurringError.message);

  const dbInstallments = (data ?? []) as InstallmentWithCard[];

  const recurringInstallments = ((recurring ?? []) as RecurringPurchaseWithCard[])
    .filter((purchase) =>
      isRecurringActiveInMonth(
        parsePurchaseDate(purchase.purchase_date),
        purchase.credit_cards.closing_day,
        billingMonth
      )
    )
    .map((purchase) => {
      const installment = buildRecurringInstallment(
        purchase,
        billingMonth,
        purchase.credit_cards.closing_day,
        purchase.credit_cards.name
      );

      return {
        ...installment,
        credit_cards: { name: purchase.credit_cards.name },
      } as InstallmentWithCard;
    });

  return [...dbInstallments, ...recurringInstallments];
};

export const getCardInvoiceTotalByMonth = async (
  creditCardId: string,
  billingMonth: string
) => {
  const installments = await getInstallmentsByMonth(creditCardId, billingMonth);
  return installments.reduce((sum, item) => sum + Number(item.amount), 0);
};
