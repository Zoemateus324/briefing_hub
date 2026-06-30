import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import "../briefing.css";

type Briefing = {
  id: string;
  loja_id: string | null;
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

type Loja = { id: string; nome: string; slug: string };

function slugify(v: string) {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel — Briefings" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [myLojaId, setMyLojaId] = useState<string | null>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaFiltro, setLojaFiltro] = useState<string>("todas");
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Briefing | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const loadBriefings = async () => {
    const { data, error } = await supabase
      .from("briefings")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setBriefings(data as Briefing[]);
  };

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/auth" });
        return;
      }
      setUserEmail(userData.user.email ?? "");
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role, loja_id")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      const admin = !!roleRow;
      setIsAdmin(admin);
      if (!admin) {
        setLoading(false);
        return;
      }
      const global = roleRow.loja_id === null;
      setIsGlobalAdmin(global);
      setMyLojaId(roleRow.loja_id);

      if (global) {
        const { data: lojasData } = await supabase
          .from("lojas")
          .select("id, nome, slug")
          .order("nome", { ascending: true });
        setLojas(lojasData ?? []);
      } else if (roleRow.loja_id) {
        const { data: lojaData } = await supabase
          .from("lojas")
          .select("id, nome, slug")
          .eq("id", roleRow.loja_id)
          .maybeSingle();
        if (lojaData) setLojas([lojaData]);
      }

      await loadBriefings();
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

  const lojaNome = (id: string | null) =>
    lojas.find((l) => l.id === id)?.nome ?? "—";

  const briefingsVisiveis =
    isGlobalAdmin && lojaFiltro !== "todas"
      ? briefings.filter((b) => b.loja_id === lojaFiltro)
      : briefings;

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
            {isGlobalAdmin
              ? "Painel da Equipe — Todas as lojas"
              : lojaNome(myLojaId)}
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
        {isGlobalAdmin && (
          <LojasManager lojas={lojas} onChange={(novas) => setLojas(novas)} />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            {briefingsVisiveis.length}{" "}
            {briefingsVisiveis.length === 1 ? "briefing" : "briefings"}
          </div>
          {isGlobalAdmin && lojas.length > 0 && (
            <select
              value={lojaFiltro}
              onChange={(e) => setLojaFiltro(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontSize: 13,
                background: "var(--white)",
                color: "var(--ink)",
              }}
            >
              <option value="todas">Todas as lojas</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {briefingsVisiveis.length === 0 ? (
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
            {briefingsVisiveis.map((b) => (
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
                {isGlobalAdmin && (
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--gold)",
                      marginBottom: 6,
                    }}
                  >
                    {lojaNome(b.loja_id)}
                  </div>
                )}
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
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: 12,
                  }}
                >
                  {new Date(b.created_at).toLocaleString("pt-BR")}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink)" }}>
                  {b.tipo_refeicao
                    ? `${labelRefeicao(b.tipo_refeicao)} · `
                    : ""}
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
            lojaNome={isGlobalAdmin ? lojaNome(selected.loja_id) : null}
            onDelete={() => remove(selected.id)}
          />
        </Modal>
      )}
    </div>
  );
}

function LojasManager({
  lojas,
  onChange,
}: {
  lojas: Loja[];
  onChange: (lojas: Loja[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const criarLoja = async () => {
    if (!nome.trim()) return;
    setCreating(true);
    setError(null);
    const slug = slugify(nome);
    const { data, error: insertError } = await supabase
      .from("lojas")
      .insert({ nome: nome.trim(), slug })
      .select("id, nome, slug")
      .single();
    setCreating(false);
    if (insertError || !data) {
      setError(
        insertError?.message.includes("duplicate")
          ? "Já existe uma loja com esse nome."
          : "Não foi possível criar a loja.",
      );
      return;
    }
    onChange([...lojas, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    setNome("");
  };

  const copiarLink = (l: Loja) => {
    const url = `${window.location.origin}/loja/${l.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(l.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
        marginBottom: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            color: "var(--sage)",
          }}
        >
          Lojas ({lojas.length})
        </div>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          {open ? "Ocultar" : "Gerenciar"}
        </span>
      </div>

      {open && (
        <div style={{ marginTop: 16 }}>
          {lojas.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {lojas.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong>{l.nome}</strong>{" "}
                    <span style={{ color: "var(--muted)" }}>
                      /loja/{l.slug}
                    </span>
                  </div>
                  <button
                    onClick={() => copiarLink(l)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                      color: "var(--sage)",
                    }}
                  >
                    {copiedId === l.id ? "Copiado!" : "Copiar link"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Nome da nova loja"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && criarLoja()}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: 13,
              }}
            />
            <button
              onClick={criarLoja}
              disabled={creating || !nome.trim()}
              style={{
                background: "var(--sage)",
                color: "var(--white)",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {creating ? "Criando..." : "Adicionar"}
            </button>
          </div>
          {error && (
            <p style={{ color: "var(--error)", fontSize: 12, marginTop: 8 }}>
              {error}
            </p>
          )}
        </div>
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

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
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
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  );
}

function DetalheBriefing({
  briefing: b,
  lojaNome,
  onDelete,
}: {
  briefing: Briefing;
  lojaNome: string | null;
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
        {lojaNome ? `${lojaNome} · ` : ""}
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
      <Row
        label="Tipo de refeição"
        value={b.tipo_refeicao && labelRefeicao(b.tipo_refeicao)}
      />
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
            <a
              href={b.spotify}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--sage)" }}
            >
              {b.spotify}
            </a>
          ) : null
        }
      />
      <Row label="Artista favorito" value={b.artista_fav} />
      <Row label="Observações" value={b.obs} />

      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
        }}
      >
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
