"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toBillingMonthString } from "@/lib/format";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { isMissingFixedExpenseEntriesTable } from "@/lib/supabase/errors";
import type {
  FixedExpenseEntryWithAccount,
  FixedExpenseWithEntry,
} from "@/types/database";

export const checkFixedExpenseEntriesTable = async () => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fixed_expense_entries")
    .select("id")
    .limit(1);

  if (error && isMissingFixedExpenseEntriesTable(error.message)) {
    return false;
  }

  if (error) throw new Error(error.message);
  return true;
};

export const getFixedExpenseEntriesByMonth = async (
  year: number,
  month: number
): Promise<FixedExpenseEntryWithAccount[]> => {
  const supabase = await createClient();
  const billingMonth = toBillingMonthString(year, month);

  const { data, error } = await supabase
    .from("fixed_expense_entries")
    .select("*, fixed_expenses(name, category, is_active)")
    .eq("billing_month", billingMonth)
    .order("due_day");

  if (error) {
    if (isMissingFixedExpenseEntriesTable(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []) as FixedExpenseEntryWithAccount[];
};

export const getFixedExpensesWithEntries = async (
  year: number,
  month: number
): Promise<FixedExpenseWithEntry[]> => {
  const supabase = await createClient();
  const billingMonth = toBillingMonthString(year, month);

  const { data: expenses, error: expensesError } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (expensesError) throw new Error(expensesError.message);

  const { data: entries, error: entriesError } = await supabase
    .from("fixed_expense_entries")
    .select("*")
    .eq("billing_month", billingMonth);

  if (entriesError) {
    if (isMissingFixedExpenseEntriesTable(entriesError.message)) {
      return (expenses ?? []).map((expense) => ({
        ...expense,
        entry: null,
      })) as FixedExpenseWithEntry[];
    }
    throw new Error(entriesError.message);
  }

  const entriesByExpenseId = new Map(
    (entries ?? []).map((entry) => [entry.fixed_expense_id, entry])
  );

  return (expenses ?? []).map((expense) => ({
    ...expense,
    entry: entriesByExpenseId.get(expense.id) ?? null,
  })) as FixedExpenseWithEntry[];
};

export const getFixedExpensesTotalByMonth = async (
  year: number,
  month: number
) => {
  const entries = await getFixedExpenseEntriesByMonth(year, month);
  return entries.reduce((sum, item) => sum + Number(item.amount), 0);
};

export const upsertFixedExpenseEntry = async (
  fixedExpenseId: string,
  year: number,
  month: number,
  formData: FormData
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  await ensureProfile(user);

  const billingMonth = toBillingMonthString(year, month);
  const amount = Number(formData.get("amount"));
  const dueDay = Number(formData.get("due_day"));
  const notes = (formData.get("notes") as string) || null;
  const entryId = formData.get("entry_id") as string | null;

  if (entryId) {
    const { error } = await supabase
      .from("fixed_expense_entries")
      .update({
        amount,
        due_day: dueDay,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("fixed_expense_entries").insert({
      fixed_expense_id: fixedExpenseId,
      user_id: user.id,
      amount,
      billing_month: billingMonth,
      due_day: dueDay,
      notes,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/contas-fixas");
  revalidatePath("/");
  revalidatePath("/relatorios/mensal");
  return { success: true };
};

export const deleteFixedExpenseEntry = async (id: string) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fixed_expense_entries")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/contas-fixas");
  revalidatePath("/");
  revalidatePath("/relatorios/mensal");
  return { success: true };
};