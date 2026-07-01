import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import "../briefing.css";

type Briefing = {
  id: string;
  nome: string;
  pessoas: number;
  tipo_refeicao: string | null;
  restricoes: string[];
  nao_gosta: string | null;
  favoritos: string | null;
  bebidas: string[];
  bebida_obs: string | null;
  recepcao: string | null;
  chegada: string | null;
  musicas: string[];
  spotify: string | null;
  artista_fav: string | null;
  obs: string | null;
  created_at: string;
  store_id: string | null;
};

type Store = { id: string; name: string; slug: string };
type Role = "admin" | "manager" | "staff" | null;

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel — Briefings" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(null);
  const [userStoreId, setUserStoreId] = useState<string | null>(null);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Briefing | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [filterStore, setFilterStore] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/auth" });
        return;
      }
      setUserEmail(userData.user.email ?? "");

      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role, store_id")
        .eq("user_id", userData.user.id);

      const roles = (roleRows ?? []) as { role: Role; store_id: string | null }[];
      let resolved: Role = null;
      let store: string | null = null;
      if (roles.some((r) => r.role === "admin")) resolved = "admin";
      else if (roles.some((r) => r.role === "manager")) {
        resolved = "manager";
        store = roles.find((r) => r.role === "manager")?.store_id ?? null;
      } else if (roles.some((r) => r.role === "staff")) {
        resolved = "staff";
        store = roles.find((r) => r.role === "staff")?.store_id ?? null;
      }
      setRole(resolved);
      setUserStoreId(store);

      if (resolved) {
        const [{ data: bs }, { data: ss }] = await Promise.all([
          supabase.from("briefings").select("*").order("created_at", { ascending: false }),
          supabase.from("stores").select("id, name, slug"),
        ]);
        setBriefings((bs ?? []) as Briefing[]);
        setStores((ss ?? []) as Store[]);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este briefing?")) return;
    const { error } = await supabase.from("briefings").delete().eq("id", id);
    if (!error) {
      setBriefings((b) => b.filter((x) => x.id !== id));
      setSelected(null);
    } else {
      alert(error.message);
    }
  };

  const storeName = (id: string | null) => stores.find((s) => s.id === id)?.name ?? "—";

  const filtered =
    role === "admin" && filterStore
      ? briefings.filter((b) => b.store_id === filterStore)
      : briefings;

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
        Carregando...
      </div>
    );
  }

  if (!role) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "var(--sage)",
            marginBottom: 12,
          }}
        >
          Sem permissão
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Sua conta não está vinculada a uma loja. Peça a um admin para liberar.
        </p>
        <button className="btn-submit" onClick={signOut} style={{ marginTop: 24 }}>
          <span>Sair</span>
        </button>
      </div>
    );
  }

  const canDelete = role === "admin" || role === "manager";
  const currentStoreLabel =
    role === "admin" ? "Todas as lojas" : storeName(userStoreId);

  return (
    <div style={{ minHeight: "100vh" }}>
      <div
        style={{
          background: "var(--sage)",
          color: "var(--white)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            Painel · {role} · {currentStoreLabel}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400 }}>
            Briefings recebidos
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {role === "admin" && (
            <Link
              to="/_authenticated/lojas"
              style={{
                color: "var(--white)",
                border: "1px solid rgba(255,255,255,0.4)",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Gerenciar lojas
            </Link>
          )}
          <span style={{ fontSize: 13, opacity: 0.8 }}>{userEmail}</span>
          <button
            onClick={signOut}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "var(--white)",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            {filtered.length} {filtered.length === 1 ? "briefing" : "briefings"}
          </div>
          {role === "admin" && (
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 13,
                background: "var(--white)",
                fontFamily: "inherit",
              }}
            >
              <option value="">Todas as lojas</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              padding: 64,
              textAlign: "center",
              background: "var(--white)",
              borderRadius: 12,
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
          >
            Nenhum briefing recebido ainda.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                style={{
                  textAlign: "left",
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 20,
                  cursor: "pointer",
                  transition: "border-color 0.18s",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "var(--gold)",
                    marginBottom: 6,
                  }}
                >
                  {storeName(b.store_id)}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 20,
                    color: "var(--sage)",
                    marginBottom: 4,
                  }}
                >
                  {b.nome}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                  {new Date(b.created_at).toLocaleString("pt-BR")}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink)" }}>
                  {b.tipo_refeicao ? `${labelRefeicao(b.tipo_refeicao)} · ` : ""}
                  {b.pessoas} pessoa(s)
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <DetalheBriefing
            briefing={selected}
            storeName={storeName(selected.store_id)}
            canDelete={canDelete}
            onDelete={() => remove(selected.id)}
          />
        </Modal>
      )}
    </div>
  );
}

function labelRefeicao(v: string) {
  return (
    { cafe: "Café da manhã", almoco: "Almoço", janta: "Jantar", brunch: "Brunch" }[v] ?? v
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,37,32,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        zIndex: 200,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--cream)",
          borderRadius: 12,
          maxWidth: 640,
          width: "100%",
          padding: 32,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        {children}
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              padding: "8px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              color: "var(--ink)",
              fontFamily: "inherit",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--muted)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

function DetalheBriefing({
  briefing: b,
  storeName,
  canDelete,
  onDelete,
}: {
  briefing: Briefing;
  storeName: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--gold)",
          marginBottom: 8,
        }}
      >
        {storeName} · {new Date(b.created_at).toLocaleString("pt-BR")}
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28,
          fontWeight: 400,
          color: "var(--sage)",
          marginBottom: 24,
        }}
      >
        {b.nome}
      </h2>

      <Row label="Pessoas" value={`${b.pessoas}`} />
      <Row label="Tipo de refeição" value={b.tipo_refeicao && labelRefeicao(b.tipo_refeicao)} />
      <Row label="Restrições" value={b.restricoes.join(", ")} />
      <Row label="Não aprecia" value={b.nao_gosta} />
      <Row label="Favoritos" value={b.favoritos} />
      <Row label="Bebidas" value={b.bebidas.join(", ")} />
      <Row label="Observação de bebidas" value={b.bebida_obs} />
      <Row label="Recepção" value={b.recepcao} />
      <Row label="Chegada" value={b.chegada} />
      <Row label="Estilos musicais" value={b.musicas.join(", ")} />
      <Row
        label="Playlist Spotify"
        value={
          b.spotify ? (
            <a href={b.spotify} target="_blank" rel="noreferrer" style={{ color: "var(--sage)" }}>
              {b.spotify}
            </a>
          ) : null
        }
      />
      <Row label="Artista favorito" value={b.artista_fav} />
      <Row label="Observações" value={b.obs} />

      {canDelete && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button
            onClick={onDelete}
            style={{
              background: "transparent",
              border: "1px solid var(--error)",
              color: "var(--error)",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            Excluir briefing
          </button>
        </div>
      )}
    </div>
  );
}
