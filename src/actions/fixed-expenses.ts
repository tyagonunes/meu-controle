"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import type { FixedExpenseCategory } from "@/types/database";

export const getFixedExpenses = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixed_expenses")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
};

export const getActiveFixedExpenses = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
};

export const createFixedExpense = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  await ensureProfile(user);

  const { error } = await supabase.from("fixed_expenses").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    category: formData.get("category") as FixedExpenseCategory,
    due_day: Number(formData.get("due_day")),
    notes: (formData.get("notes") as string) || null,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/contas-fixas");
  revalidatePath("/");
  revalidatePath("/relatorios/mensal");
  return { success: true };
};

export const updateFixedExpense = async (id: string, formData: FormData) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from("fixed_expenses")
    .update({
      name: formData.get("name") as string,
      category: formData.get("category") as FixedExpenseCategory,
      due_day: Number(formData.get("due_day")),
      notes: (formData.get("notes") as string) || null,
      is_active: formData.get("is_active") === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/contas-fixas");
  revalidatePath("/");
  revalidatePath("/relatorios/mensal");
  return { success: true };
};

export const deleteFixedExpense = async (id: string) => {
  const supabase = await createClient();
  const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/contas-fixas");
  revalidatePath("/");
  revalidatePath("/relatorios/mensal");
  return { success: true };
};
