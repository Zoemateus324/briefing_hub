import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AssignInput = {
  email: string;
  store_id: string;
  role: "manager" | "staff";
};

export const assignUserToStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AssignInput) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input");
    if (!input.email || !input.store_id) throw new Error("Missing fields");
    if (input.role !== "manager" && input.role !== "staff")
      throw new Error("Invalid role");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Erro ao verificar permissão");
    if (!isAdmin) throw new Error("Somente admin pode vincular usuários");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Busca usuário pelo e-mail via Auth Admin API (paginação)
    const email = data.email.trim().toLowerCase();
    let targetUserId: string | null = null;
    let page = 1;
    // limita a 20 páginas por segurança
    while (page <= 20 && !targetUserId) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw new Error("Erro ao buscar usuários");
      const found = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found) targetUserId = found.id;
      if (!list.users.length || list.users.length < 200) break;
      page++;
    }

    if (!targetUserId) throw new Error("Usuário não encontrado. Peça que se cadastre em /auth.");

    // Insere/atualiza vínculo (idempotente)
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: targetUserId, role: data.role, store_id: data.store_id },
        { onConflict: "user_id,role,store_id" },
      );
    if (insErr) throw new Error(insErr.message);

    return { ok: true, user_id: targetUserId };
  });
