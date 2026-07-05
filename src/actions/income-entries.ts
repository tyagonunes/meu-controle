"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPreviousYearMonth, toBillingMonthString } from "@/lib/format";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { isMissingIncomeEntriesTable } from "@/lib/supabase/errors";
import type {
  IncomeEntryWithSource,
  IncomeSourceWithEntry,
} from "@/types/database";

const REVALIDATE_PATHS = ["/receitas", "/", "/relatorios/mensal"] as const;

const revalidateIncomePaths = () => {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
};

export const checkIncomeEntriesTable = async () => {
  const supabase = await createClient();
  const { error } = await supabase.from("income_entries").select("id").limit(1);

  if (error && isMissingIncomeEntriesTable(error.message)) {
    return false;
  }

  if (error) throw new Error(error.message);
  return true;
};

export const getIncomeEntriesByMonth = async (
  year: number,
  month: number
): Promise<IncomeEntryWithSource[]> => {
  const supabase = await createClient();
  const billingMonth = toBillingMonthString(year, month);

  const { data, error } = await supabase
    .from("income_entries")
    .select("*, income_sources(name, type, category, is_active)")
    .eq("billing_month", billingMonth)
    .order("received_day");

  if (error) {
    if (isMissingIncomeEntriesTable(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []) as IncomeEntryWithSource[];
};

export const getIncomeSourcesWithEntries = async (
  year: number,
  month: number
): Promise<IncomeSourceWithEntry[]> => {
  const supabase = await createClient();
  const billingMonth = toBillingMonthString(year, month);
  const previous = getPreviousYearMonth(year, month);
  const previousBillingMonth = toBillingMonthString(previous.year, previous.month);

  const { data: sources, error: sourcesError } = await supabase
    .from("income_sources")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (sourcesError) throw new Error(sourcesError.message);

  const { data: entries, error: entriesError } = await supabase
    .from("income_entries")
    .select("*")
    .in("billing_month", [billingMonth, previousBillingMonth]);

  if (entriesError) {
    if (isMissingIncomeEntriesTable(entriesError.message)) {
      return (sources ?? []).map((source) => ({
        ...source,
        entry: null,
        previousEntry: null,
      })) as IncomeSourceWithEntry[];
    }
    throw new Error(entriesError.message);
  }

  const entriesBySourceId = new Map<string, (typeof entries)[number]>();
  const previousEntriesBySourceId = new Map<string, (typeof entries)[number]>();

  for (const entry of entries ?? []) {
    if (entry.billing_month === billingMonth) {
      entriesBySourceId.set(entry.income_source_id, entry);
    }

    if (entry.billing_month === previousBillingMonth) {
      previousEntriesBySourceId.set(entry.income_source_id, entry);
    }
  }

  return (sources ?? []).map((source) => ({
    ...source,
    entry: entriesBySourceId.get(source.id) ?? null,
    previousEntry: previousEntriesBySourceId.get(source.id) ?? null,
  })) as IncomeSourceWithEntry[];
};

export const getIncomeTotalByMonth = async (year: number, month: number) => {
  const entries = await getIncomeEntriesByMonth(year, month);
  return entries.reduce((sum, item) => sum + Number(item.amount), 0);
};

export const upsertIncomeEntry = async (
  incomeSourceId: string,
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
  const receivedDay = Number(formData.get("received_day"));
  const notes = (formData.get("notes") as string) || null;
  const entryId = formData.get("entry_id") as string | null;

  if (entryId) {
    const { error } = await supabase
      .from("income_entries")
      .update({
        amount,
        received_day: receivedDay,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("income_entries").insert({
      income_source_id: incomeSourceId,
      user_id: user.id,
      amount,
      billing_month: billingMonth,
      received_day: receivedDay,
      notes,
    });

    if (error) return { error: error.message };
  }

  revalidateIncomePaths();
  return { success: true };
};

export const deleteIncomeEntry = async (id: string) => {
  const supabase = await createClient();
  const { error } = await supabase.from("income_entries").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidateIncomePaths();
  return { success: true };
};
