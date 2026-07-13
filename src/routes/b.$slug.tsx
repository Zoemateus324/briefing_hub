import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import "./briefing.css";

export const Route = createFileRoute("/b/$slug")({
  head: () => ({
    meta: [
      { title: "Briefing de Experiência" },
      {
        name: "description",
        content:
          "Briefing personalizado para preparar sua experiência — do cardápio à trilha sonora.",
      },
    ],
  }),
  component: BriefingPage,
  notFoundComponent: () => (
    <div style={{ padding: 80, textAlign: "center" }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--sage)" }}>
        Loja não encontrada
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 12 }}>
        Verifique o link recebido.
      </p>
    </div>
  ),
  errorComponent: () => (
    <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>
      Erro ao carregar. Tente novamente.
    </div>
  ),
});

type Store = { id: string; name: string; slug: string };

type ChipOption = { value: string; label: string };
type RadioOption = { value: string; icon: string; label: string };

const TIPOS_REFEICAO: RadioOption[] = [
  { value: "cafe", icon: "☕", label: "Café da manhã" },
  { value: "almoco", icon: "🍽️", label: "Almoço" },
  { value: "janta", icon: "🌙", label: "Jantar" },
  { value: "brunch", icon: "🥂", label: "Brunch" },
];
const RESTRICOES: ChipOption[] = [
  { value: "doces", label: "Doces" },
  { value: "salgados", label: "Salgados" },
];
const BEBIDAS: ChipOption[] = [
  { value: "cafe_coado", label: "☕ Café coado" },
  { value: "espresso", label: "🫖 Espresso" },
  { value: "cha", label: "🍵 Chá" },
  { value: "suco_natural", label: "🍊 Suco natural" },
  { value: "agua_com_gas", label: "💧 Água com gás" },
  { value: "refrigerante", label: "🥤 Refrigerante" },
  { value: "vinho", label: "🍷 Vinho" },
  { value: "cerveja", label: "🍺 Cerveja" },
  { value: "agua_mineral", label: "💧 Água mineral" },
  { value: "smoothie", label: "🥤 Cappucino" },
];
const RECEPCOES: RadioOption[] = [
  { value: "formal", icon: "🤝", label: "Formal e profissional" },
  { value: "descontraido", icon: "😊", label: "Descontraído e caloroso" },
  { value: "discreto", icon: "🌿", label: "Discreto e tranquilo" },
  { value: "surpresa", icon: "✨", label: "Me surpreenda!" },
];
const MUSICAS: ChipOption[] = [
  { value: "jazz", label: "🎷 Jazz" },
  { value: "mpb", label: "🎸 MPB" },
  { value: "bossa_nova", label: "🎵 Bossa Nova" },
  { value: "classica", label: "🎻 Clássica" },
  { value: "pop", label: "🎤 Pop" },
  { value: "lofi", label: "🎧 Lo-fi / Ambiente" },
  { value: "instrumental", label: "🎹 Instrumental" },
  { value: "samba", label: "🥁 Samba / Pagode" },
  { value: "rock", label: "🎸 Rock" },
  { value: "sem_musica", label: "🔇 Prefiro silêncio" },
];

function BriefingPage() {
  const { slug } = Route.useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundStore, setNotFoundStore] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) {
        setNotFoundStore(true);
      } else {
        setStore(data as Store);
      }
      setLoading(false);
    })();
  }, [slug]);

  const [nome, setNome] = useState("");
  const [pessoas, setPessoas] = useState(1);
  const [tipoRefeicao, setTipoRefeicao] = useState("");
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [naoGosta, setNaoGosta] = useState("");
  const [favoritos, setFavoritos] = useState("");
  const [bebidas, setBebidas] = useState<string[]>([]);
  const [bebidaObs, setBebidaObs] = useState("");
  const [recepcao, setRecepcao] = useState("");
  const [chegada, setChegada] = useState("");
  const [musicas, setMusicas] = useState<string[]>([]);
  const [spotify, setSpotify] = useState("");
  const [artistaFav, setArtistaFav] = useState("");
  const [obs, setObs] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [nomeError, setNomeError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const done = useMemo(() => {
    const checks = [
      nome.trim().length > 0,
      tipoRefeicao !== "",
      restricoes.length > 0,
      bebidas.length > 0,
      recepcao !== "",
      musicas.length > 0,
      true,
    ];
    return checks.filter(Boolean).length;
  }, [nome, tipoRefeicao, restricoes, bebidas, recepcao, musicas]);
  const pct = Math.round((done / 7) * 100);

  const submit = async () => {
    if (!store) return;
    if (!nome.trim()) {
      setNomeError(true);
      setTimeout(() => setNomeError(false), 2000);
      document.getElementById("nome")?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase.from("briefings").insert({
      nome: nome.trim(),
      pessoas,
      tipo_refeicao: tipoRefeicao || null,
      restricoes,
      nao_gosta: naoGosta || null,
      favoritos: favoritos || null,
      bebidas,
      bebida_obs: bebidaObs || null,
      recepcao: recepcao || null,
      chegada: chegada || null,
      musicas,
      spotify: spotify || null,
      artista_fav: artistaFav || null,
      obs: obs || null,
      store_id: store.id,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError("Não foi possível enviar. Tente novamente.");
      return;
    }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>Carregando...</div>;
  }
  if (notFoundStore) {
    throw notFound();
  }

  if (submitted) {
    return (
      <div className="success-screen">
        <div className="icon">🌿</div>
        <h2>Tudo anotado com carinho.</h2>
        <p>
          Agora é com a gente. A equipe de <strong>{store?.name}</strong> está preparando
          cada detalhe para que você se sinta realmente bem-vindo(a).
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <div className="header-eyebrow">{store?.name}</div>
        <h1>
          Cada detalhe importa.
          <br />
          <em>Conte-nos sobre você.</em>
        </h1>
        <p>
          Este briefing nos ajuda a preparar um momento feito especialmente para você — do
          cardápio à trilha sonora.
        </p>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="progress-label">{done} de 7</div>
      </div>

      <div className="form-container">
        <div className="section">
          <div className="section-label">
            <div className="section-num">1</div>
            <div className="section-title">Como prefere ser chamado?</div>
          </div>
          <div className="field">
            
            <input
              id="nome"
              type="text"
              placeholder="Ex: Ana, Dr. Fonseca, Gi..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={nomeError ? { borderColor: "var(--error)" } : undefined}
            />
          </div>
       
        </div>
        <div className="section-divider" />

    

        <div className="section">
          <div className="section-label">
            <div className="section-num">2</div>
            <div className="section-title">Petisco?</div>
          </div>
          <div className="field">
        
            <div className="chip-group">
              {RESTRICOES.map((c) => (
                <div
                  key={c.value}
                  className={`chip${restricoes.includes(c.value) ? " active" : ""}`}
                  onClick={() => setRestricoes((p) => toggle(p, c.value))}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>
         
          <div className="field">
            <label>
              Quais comidas fazem seus olhos brilharem?{" "}
              <span className="hint">opcional, mas adoramos saber</span>
            </label>
            <textarea
              placeholder="Ex: pão de queijo quentinho, bolo de cenoura, sushi..."
              value={favoritos}
              onChange={(e) => setFavoritos(e.target.value)}
            />
          </div>
        </div>
        <div className="section-divider" />

        <div className="section">
          <div className="section-label">
            <div className="section-num">3</div>
            <div className="section-title">O que você gosta de beber?</div>
          </div>
          <div className="field">
            <label>
              Preferências de bebida <span className="hint">selecione todas que gostar</span>
            </label>
            <div className="chip-group">
              {BEBIDAS.map((c) => (
                <div
                  key={c.value}
                  className={`chip${bebidas.includes(c.value) ? " active" : ""}`}
                  onClick={() => setBebidas((p) => toggle(p, c.value))}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>
         
        </div>
        <div className="section-divider" />

{/* Spotify */}       

        <div className="section">
          <div className="section-label">
            <div className="section-num">4</div>
            <div className="section-title">A trilha sonora do seu momento</div>
          </div>
          <div className="field">
            <label>
              Estilos musicais que combinam com você{" "}
              <span className="hint">selecione os que gostar</span>
            </label>
            <div className="chip-group">
              {MUSICAS.map((c) => (
                <div
                  key={c.value}
                  className={`chip${musicas.includes(c.value) ? " active" : ""}`}
                  onClick={() => setMusicas((p) => toggle(p, c.value))}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>
              Tem uma playlist no Spotify que captura seu mood?{" "}
              <span className="hint">cole o link aqui</span>
            </label>
            <input
              type="url"
              placeholder="https://open.spotify.com/playlist/..."
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Algum artista ou música que não pode faltar?</label>
            <input
              type="text"
              placeholder="Ex: Djavan, Tom Jobim, Miles Davis..."
              value={artistaFav}
              onChange={(e) => setArtistaFav(e.target.value)}
            />
          </div>
        </div>
        <div className="section-divider" />







{/* Observacoes */}
        <div className="section">
          <div className="section-label">
            <div className="section-num">5</div>
            <div className="section-title">Observações?</div>
          </div>
          <div className="field">
            <label>
              Observações adicionais, preferências especiais ou qualquer detalhe que queira
              compartilhar
            </label>
            <textarea
              placeholder="Fique à vontade para contar qualquer coisa que torne essa experiência mais especial para você..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              style={{ minHeight: 100 }}
            />
          </div>
        </div>

        <div className="submit-section">
          <p className="submit-note">
            Suas informações são utilizadas exclusivamente para preparar
            <br />a sua experiência com <strong>{store?.name}</strong>. Nada além disso.
          </p>
          {submitError && (
            <p style={{ color: "var(--error)", fontSize: 13, marginBottom: 16 }}>
              {submitError}
            </p>
          )}
          <button className="btn-submit" onClick={submit} disabled={submitting}>
            <span>{submitting ? "Enviando..." : "Enviar meu briefing"}</span>
            {!submitting && <span>→</span>}
          </button>
        </div>
      </div>
    </>
  );
}
