"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

export const getCreditCards = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
};

export const getCreditCard = async (id: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const createCreditCard = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  await ensureProfile(user);

  const { data: card, error } = await supabase
    .from("credit_cards")
    .insert({
      user_id: user.id,
      name: formData.get("name") as string,
      last_digits: (formData.get("last_digits") as string) || null,
      closing_day: Number(formData.get("closing_day")),
      due_day: Number(formData.get("due_day")),
      credit_limit: formData.get("credit_limit")
        ? Number(formData.get("credit_limit"))
        : null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const ownerName =
    (formData.get("owner_name") as string) ||
    user.user_metadata?.full_name ||
    "Eu";

  const { error: memberError } = await supabase.from("card_members").insert({
    credit_card_id: card.id,
    name: ownerName,
    is_owner: true,
  });

  if (memberError) return { error: memberError.message };

  revalidatePath("/cartoes");
  return { success: true, id: card.id };
};

export const updateCreditCard = async (id: string, formData: FormData) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from("credit_cards")
    .update({
      name: formData.get("name") as string,
      last_digits: (formData.get("last_digits") as string) || null,
      closing_day: Number(formData.get("closing_day")),
      due_day: Number(formData.get("due_day")),
      credit_limit: formData.get("credit_limit")
        ? Number(formData.get("credit_limit"))
        : null,
      is_active: formData.get("is_active") === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/cartoes");
  revalidatePath(`/cartoes/${id}`);
  return { success: true };
};

export const deleteCreditCard = async (id: string) => {
  const supabase = await createClient();
  const { error } = await supabase.from("credit_cards").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/cartoes");
  return { success: true };
};
