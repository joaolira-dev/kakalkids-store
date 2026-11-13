import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

/**
 * Garante que quem está acessando é admin (Data Access Layer do painel).
 * Usar no início de toda página e Server Action do /admin.
 */
export async function requireAdmin(): Promise<{ user: AdminUser; supabase: Awaited<ReturnType<typeof createSessionClient>> }> {
  // A sessão é sempre por request: nada daqui entra no HTML estático
  await connection();
  const supabase = await createSessionClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/admin/login");

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", claims.sub).maybeSingle();
  if (!admin) redirect("/admin/login?erro=sem-acesso");

  return { user: { id: claims.sub, email: String(claims.email ?? "") }, supabase };
}
