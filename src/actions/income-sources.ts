"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import type { IncomeCategory, IncomeSourceType } from "@/types/database";

const REVALIDATE_PATHS = ["/receitas", "/", "/relatorios/mensal"] as const;

const revalidateIncomePaths = () => {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
};

export const getIncomeSources = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income_sources")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
};

export const createIncomeSource = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  await ensureProfile(user);

  const { error } = await supabase.from("income_sources").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    type: formData.get("type") as IncomeSourceType,
    category: formData.get("category") as IncomeCategory,
    expected_day: Number(formData.get("expected_day")),
    notes: (formData.get("notes") as string) || null,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidateIncomePaths();
  return { success: true };
};

export const updateIncomeSource = async (id: string, formData: FormData) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from("income_sources")
    .update({
      name: formData.get("name") as string,
      type: formData.get("type") as IncomeSourceType,
      category: formData.get("category") as IncomeCategory,
      expected_day: Number(formData.get("expected_day")),
      notes: (formData.get("notes") as string) || null,
      is_active: formData.get("is_active") === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateIncomePaths();
  return { success: true };
};

export const deleteIncomeSource = async (id: string) => {
  const supabase = await createClient();
  const { error } = await supabase.from("income_sources").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidateIncomePaths();
  return { success: true };
};
