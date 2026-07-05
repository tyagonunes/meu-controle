"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const getCardMembers = async (creditCardId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("card_members")
    .select("*")
    .eq("credit_card_id", creditCardId)
    .order("is_owner", { ascending: false })
    .order("name");

  if (error) throw new Error(error.message);
  return data;
};

export const createCardMember = async (
  creditCardId: string,
  formData: FormData
) => {
  const supabase = await createClient();

  const { error } = await supabase.from("card_members").insert({
    credit_card_id: creditCardId,
    name: formData.get("name") as string,
    is_owner: false,
  });

  if (error) return { error: error.message };

  revalidatePath(`/cartoes/${creditCardId}`);
  return { success: true };
};

export const updateCardMember = async (
  id: string,
  creditCardId: string,
  formData: FormData
) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from("card_members")
    .update({ name: formData.get("name") as string })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/cartoes/${creditCardId}`);
  return { success: true };
};

export const deleteCardMember = async (id: string, creditCardId: string) => {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("card_member_id", id);

  if (countError) return { error: countError.message };
  if (count && count > 0) {
    return { error: "Não é possível excluir membro com compras vinculadas" };
  }

  const { error } = await supabase.from("card_members").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/cartoes/${creditCardId}`);
  return { success: true };
};
