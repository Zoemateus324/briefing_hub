import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { assignUserToStore } from "@/lib/stores.functions";
import "../briefing.css";


export const Route = createFileRoute("/_authenticated/lojas")({
  head: () => ({ meta: [{ title: "Lojas — Painel" }] }),
  component: LojasPage,
});

type Store = { id: string; name: string; slug: string; created_at: string };
type RoleRow = {
  id: string;
  user_id: string;
  role: "admin" | "manager" | "staff" | "user";
  store_id: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function LojasPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [assignStoreId, setAssignStoreId] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState<"manager" | "staff">("staff");
  const [assigning, setAssigning] = useState(false);

  const load = async () => {
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from("stores").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role, store_id"),
    ]);
    setStores((s ?? []) as Store[]);
    setRoles((r ?? []) as RoleRow[]);
  };

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: adminRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      const admin = !!adminRow;
      setIsAdmin(admin);
      if (admin) await load();
      setLoading(false);
    })();
  }, [navigate]);

  const createStore = async () => {
    setError(null);
    setInfo(null);
    if (!newName.trim()) {
      setError("Informe o nome da loja.");
      return;
    }
    const slug = (newSlug.trim() || slugify(newName)).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError("Slug inválido. Use letras, números e traços.");
      return;
    }
    setCreating(true);
    const { error } = await supabase
      .from("stores")
      .insert({ name: newName.trim(), slug });
    setCreating(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewName("");
    setNewSlug("");
    setInfo("Loja criada.");
    await load();
  };

  const deleteStore = async (id: string) => {
    if (!confirm("Excluir esta loja? Vínculos de usuários serão removidos.")) return;
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) setError(error.message);
    else await load();
  };

  const assignFn = useServerFn(assignUserToStore);
  const assignUser = async () => {
    setError(null);
    setInfo(null);
    if (!assignStoreId) {
      setError("Selecione uma loja.");
      return;
    }
    if (!assignEmail.trim()) {
      setError("Informe o e-mail do usuário.");
      return;
    }
    setAssigning(true);
    try {
      await assignFn({
        data: {
          email: assignEmail.trim(),
          store_id: assignStoreId,
          role: assignRole,
        },
      });
      setAssignEmail("");
      setInfo("Usuário vinculado.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao vincular");
    } finally {
      setAssigning(false);
    }
  };


  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>Carregando...</div>;
  }
  if (!isAdmin) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--sage)" }}>
          Apenas admins
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Sua conta não tem acesso.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div
        style={{
          background: "var(--sage)",
          color: "var(--white)",
          padding: "20px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 4,
            }}
          >
            Administração
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400 }}>
            Lojas e usuários
          </h1>
        </div>
        <Link
          to="/admin"
          style={{
            color: "var(--white)",
            border: "1px solid rgba(255,255,255,0.4)",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          ← Briefings
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
        {error && (
          <div
            style={{
              background: "rgba(200,60,60,0.08)",
              border: "1px solid var(--error)",
              color: "var(--error)",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        {info && (
          <div
            style={{
              background: "rgba(70,120,90,0.08)",
              border: "1px solid var(--sage)",
              color: "var(--sage)",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {info}
          </div>
        )}

        <section style={cardStyle}>
          <h3 style={h3Style}>Nova loja</h3>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr auto" }}>
            <input
              placeholder="Nome (Ex: Café Central)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => !newSlug && setNewSlug(slugify(newName))}
              style={inputStyle}
            />
            <input
              placeholder="slug (Ex: cafe-central)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={createStore}
              disabled={creating}
              style={{ ...btnStyle, opacity: creating ? 0.6 : 1 }}
            >
              {creating ? "Criando..." : "Criar"}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            URL do formulário: <code>/b/&lt;slug&gt;</code>
          </p>
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>Lojas ({stores.length})</h3>
          {stores.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Nenhuma loja ainda.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {stores.map((s) => {
                const staff = roles.filter((r) => r.store_id === s.id);
                const url = `${window.location.origin}/b/${s.slug}`;
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: 16,
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      background: "var(--white)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 18,
                            color: "var(--sage)",
                          }}
                        >
                          {s.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          /b/{s.slug}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 6 }}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "var(--sage)" }}
                          >
                            {url}
                          </a>{" "}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(url);
                              setInfo("Link copiado.");
                            }}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--border)",
                              padding: "2px 8px",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 11,
                              marginLeft: 4,
                            }}
                          >
                            copiar
                          </button>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                          {staff.length} usuário(s) vinculado(s)
                        </div>
                      </div>
                      <button
                        onClick={() => deleteStore(s.id)}
                        style={{
                          background: "transparent",
                          border: "1px solid var(--error)",
                          color: "var(--error)",
                          padding: "6px 12px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                          height: "fit-content",
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                    {staff.length > 0 && (
                      <ul style={{ marginTop: 12, fontSize: 12, color: "var(--ink)" }}>
                        {staff.map((r) => (
                          <li
                            key={r.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "4px 0",
                              borderTop: "1px dashed var(--border)",
                            }}
                          >
                            <span>
                              <code style={{ fontSize: 11 }}>{r.user_id.slice(0, 8)}…</code>{" "}
                              <span
                                style={{
                                  background: "var(--cream)",
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  marginLeft: 4,
                                }}
                              >
                                {r.role}
                              </span>
                            </span>
                            <button
                              onClick={async () => {
                                if (!confirm("Remover vínculo?")) return;
                                await supabase.from("user_roles").delete().eq("id", r.id);
                                await load();
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--error)",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              remover
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <h3 style={h3Style}>Vincular usuário a uma loja</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            O usuário deve ter feito cadastro em <Link to="/auth" style={{ color: "var(--sage)" }}>/auth</Link> antes.
            Informe o e-mail para vincular.
          </p>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 140px auto" }}>
            <input
              placeholder="e-mail do usuário"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              style={inputStyle}
            />
            <select
              value={assignStoreId}
              onChange={(e) => setAssignStoreId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecione a loja...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value as "manager" | "staff")}
              style={inputStyle}
            >
              <option value="staff">staff</option>
              <option value="manager">manager</option>
            </select>
            <button
              onClick={assignUser}
              disabled={assigning}
              style={{ ...btnStyle, opacity: assigning ? 0.6 : 1 }}
            >
              {assigning ? "..." : "Vincular"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
};
const h3Style: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 18,
  color: "var(--sage)",
  marginBottom: 16,
};
const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  background: "var(--white)",
};
const btnStyle: React.CSSProperties = {
  background: "var(--sage)",
  color: "var(--white)",
  border: "none",
  padding: "10px 18px",
  borderRadius: 8,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
