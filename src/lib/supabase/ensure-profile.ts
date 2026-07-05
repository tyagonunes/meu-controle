import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const ensureProfile = async (user: User) => {
  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc("ensure_profile");

  if (!rpcError) return;

  const fullName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: fullName,
  });

  if (insertError && !insertError.message.includes("duplicate")) {
    throw new Error(insertError.message);
  }
};
