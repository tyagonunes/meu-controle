"use server";

import { getFixedExpenseEntriesByMonth } from "@/actions/fixed-expense-entries";
import { getCreditCards } from "@/actions/credit-cards";
import { getAllInstallmentsByMonth } from "@/actions/purchases";
import { categoryLabels, toBillingMonthString } from "@/lib/format";
import type { FixedExpenseCategory } from "@/types/database";

export const getMonthlyReport = async (year: number, month: number) => {
  const billingMonth = toBillingMonthString(year, month);

  const [fixedEntries, cards, installments] = await Promise.all([
    getFixedExpenseEntriesByMonth(year, month),
    getCreditCards(),
    getAllInstallmentsByMonth(billingMonth),
  ]);

  const fixedTotal = fixedEntries.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const fixedExpenseBreakdown = fixedEntries.map((entry) => ({
    id: entry.id,
    name: entry.fixed_expenses.name,
    category: entry.fixed_expenses.category as FixedExpenseCategory,
    categoryLabel: categoryLabels[entry.fixed_expenses.category as FixedExpenseCategory],
    amount: Number(entry.amount),
    dueDay: entry.due_day,
  }));

  const cardTotals = cards.map((card) => {
    const cardInstallments = installments.filter(
      (i) => i.credit_card_id === card.id
    );
    const total = cardInstallments.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );
    const othersTotal = cardInstallments
      .filter((i) => !i.purchases.card_members.is_owner)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const ownerTotal = total - othersTotal;

    return {
      cardId: card.id,
      cardName: card.name,
      total,
      ownerTotal,
      othersTotal,
    };
  });

  const cardsTotal = cardTotals.reduce((sum, c) => sum + c.total, 0);
  const othersOnMyCards = cardTotals.reduce(
    (sum, c) => sum + c.othersTotal,
    0
  );
  const grandTotal = fixedTotal + cardsTotal;

  const memberBreakdown = installments.reduce<
    Record<string, { name: string; isOwner: boolean; total: number }>
  >((acc, item) => {
    const member = item.purchases.card_members;
    const key = member.name;

    if (!acc[key]) {
      acc[key] = { name: member.name, isOwner: member.is_owner, total: 0 };
    }

    acc[key].total += Number(item.amount);
    return acc;
  }, {});

  return {
    billingMonth,
    fixedTotal,
    fixedExpenseBreakdown,
    cardTotals,
    cardsTotal,
    othersOnMyCards,
    grandTotal,
    memberBreakdown: Object.values(memberBreakdown).sort(
      (a, b) => b.total - a.total
    ),
  };
};
