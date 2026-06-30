import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
};

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel — Briefings" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Briefing | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

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
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      const admin = !!roleRows;
      setIsAdmin(admin);
      if (!admin) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("briefings")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setBriefings(data as Briefing[]);
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
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
        Carregando...
      </div>
    );
  }

  if (!isAdmin) {
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
          Sua conta não tem acesso ao painel. Peça a um admin para liberar.
        </p>
        <button
          className="btn-submit"
          onClick={signOut}
          style={{ marginTop: 24 }}
        >
          <span>Sair</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Top bar */}
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
            Painel da Equipe
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 400,
            }}
          >
            Briefings recebidos
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 24px 80px",
        }}
      >
        <div style={{ marginBottom: 24, color: "var(--muted)", fontSize: 14 }}>
          {briefings.length} {briefings.length === 1 ? "briefing" : "briefings"}
        </div>

        {briefings.length === 0 ? (
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
            {briefings.map((b) => (
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
                  transition: "border-color 0.18s, transform 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--sage-light)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              >
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
          <DetalheBriefing briefing={selected} onDelete={() => remove(selected.id)} />
        </Modal>
      )}
    </div>
  );
}

function labelRefeicao(v: string) {
  return (
    {
      cafe: "Café da manhã",
      almoco: "Almoço",
      janta: "Jantar",
      brunch: "Brunch",
    }[v] ?? v
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
  onDelete,
}: {
  briefing: Briefing;
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
        {new Date(b.created_at).toLocaleString("pt-BR")}
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
    </div>
  );
}
