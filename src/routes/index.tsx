import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import "./briefing.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Briefing de Experiência — Bem-vindo(a)" },
      {
        name: "description",
        content:
          "Briefing personalizado para preparar sua experiência — do cardápio à trilha sonora.",
      },
      { property: "og:title", content: "Briefing de Experiência — Bem-vindo(a)" },
      {
        property: "og:description",
        content:
          "Briefing personalizado para preparar sua experiência — do cardápio à trilha sonora.",
      },
    ],
  }),
  component: BriefingPage,
});

type RefeicaoOption = { value: string; icon: string; label: string };
type RecepcaoOption = { value: string; icon: string; label: string };
type ChipOption = { value: string; label: string };

const TIPOS_REFEICAO: RefeicaoOption[] = [
  { value: "cafe", icon: "☕", label: "Café da manhã" },
  { value: "almoco", icon: "🍽️", label: "Almoço" },
  { value: "janta", icon: "🌙", label: "Jantar" },
  { value: "brunch", icon: "🥂", label: "Brunch" },
];

const RESTRICOES: ChipOption[] = [
  { value: "vegetariano", label: "🌱 Vegetariano" },
  { value: "vegano", label: "🥦 Vegano" },
  { value: "sem_gluten", label: "🌾 Sem glúten" },
  { value: "sem_lactose", label: "🥛 Sem lactose" },
  { value: "sem_frutos_mar", label: "🦐 Sem frutos do mar" },
  { value: "sem_carne_vermelha", label: "🥩 Sem carne vermelha" },
  { value: "low_carb", label: "⚡ Low carb" },
  { value: "diabetico", label: "💊 Diabético(a)" },
  { value: "nenhuma", label: "✅ Nenhuma" },
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
  { value: "smoothie", label: "🥤 Smoothie" },
];

const RECEPCOES: RecepcaoOption[] = [
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

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async () => {
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
    });
    setSubmitting(false);
    if (error) {
      setSubmitError("Não foi possível enviar. Tente novamente.");
      return;
    }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="success-screen">
        <div className="icon">🌿</div>
        <h2>Tudo anotado com carinho.</h2>
        <p>
          Agora é com a gente. Estamos preparando cada detalhe para que você se sinta
          realmente bem-vindo(a).
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <div className="header-eyebrow">Experiência Personalizada</div>
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
        {/* 1 */}
        <div className="section">
          <div className="section-label">
            <div className="section-num">1</div>
            <div className="section-title">Quem é você?</div>
          </div>
          <div className="field">
            <label>
              Como prefere ser chamado(a)?{" "}
              <span className="hint">nome, apelido — do jeito que se sentir bem</span>
            </label>
            <input
              id="nome"
              type="text"
              placeholder="Ex: Ana, Dr. Fonseca, Gi..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={nomeError ? { borderColor: "var(--error)" } : undefined}
            />
          </div>
          <div className="field">
            <label>Quantas pessoas participarão desta experiência?</label>
            <div className="range-wrap">
              <input
                type="range"
                min={1}
                max={20}
                value={pessoas}
                onChange={(e) => setPessoas(parseInt(e.target.value))}
              />
              <div className="range-value">
                {pessoas} <span>pessoa(s)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="section-divider" />

        {/* 2 */}
        <div className="section">
          <div className="section-label">
            <div className="section-num">2</div>
            <div className="section-title">Qual momento vamos compartilhar?</div>
          </div>
          <div className="field">
            <label>Tipo de refeição</label>
            <div className="radio-cards">
              {TIPOS_REFEICAO.map((o) => (
                <div
                  key={o.value}
                  className={`radio-card${tipoRefeicao === o.value ? " active" : ""}`}
                  onClick={() => setTipoRefeicao(o.value)}
                >
                  <div className="rc-icon">{o.icon}</div>
                  <div className="rc-label">{o.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="section-divider" />

        {/* 3 */}
        <div className="section">
          <div className="section-label">
            <div className="section-num">3</div>
            <div className="section-title">O que você gosta de comer?</div>
          </div>
          <div className="field">
            <label>
              Restrições alimentares ou alergias{" "}
              <span className="hint">selecione todas que se aplicam</span>
            </label>
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
              Alimentos que <strong>não</strong> aprecia ou prefere evitar
            </label>
            <textarea
              placeholder="Ex: não gosto de coentro, evito pimenta forte, não como fígado..."
              value={naoGosta}
              onChange={(e) => setNaoGosta(e.target.value)}
            />
          </div>
          <div className="field">
            <label>
              Quais comidas fazem seus olhos brilharem?{" "}
              <span className="hint">opcional, mas adoramos saber</span>
            </label>
            <textarea
              placeholder="Ex: pão de queijo quentinho, bolo de cenoura, sushi, uma boa massa..."
              value={favoritos}
              onChange={(e) => setFavoritos(e.target.value)}
            />
          </div>
        </div>
        <div className="section-divider" />

        {/* 4 */}
        <div className="section">
          <div className="section-label">
            <div className="section-num">4</div>
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
          <div className="field">
            <label>
              Alguma observação sobre bebidas?{" "}
              <span className="hint">alergias, preferências específicas</span>
            </label>
            <input
              type="text"
              placeholder="Ex: café sem açúcar, suco de uva sem álcool..."
              value={bebidaObs}
              onChange={(e) => setBebidaObs(e.target.value)}
            />
          </div>
        </div>
        <div className="section-divider" />

        {/* 5 */}
        <div className="section">
          <div className="section-label">
            <div className="section-num">5</div>
            <div className="section-title">Como prefere ser recebido(a)?</div>
          </div>
          <div className="field">
            <label>Estilo de recepção</label>
            <div className="radio-cards">
              {RECEPCOES.map((o) => (
                <div
                  key={o.value}
                  className={`radio-card${recepcao === o.value ? " active" : ""}`}
                  onClick={() => setRecepcao(o.value)}
                >
                  <div className="rc-icon">{o.icon}</div>
                  <div className="rc-label">{o.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Algo especial que tornaria sua chegada mais agradável?</label>
            <textarea
              placeholder="Ex: prefiro ambiente mais silencioso, gosto de ser apresentado(a) ao espaço antes, etc."
              value={chegada}
              onChange={(e) => setChegada(e.target.value)}
            />
          </div>
        </div>
        <div className="section-divider" />

        {/* 6 */}
        <div className="section">
          <div className="section-label">
            <div className="section-num">6</div>
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

        {/* 7 */}
        <div className="section">
          <div className="section-label">
            <div className="section-num">7</div>
            <div className="section-title">Mais alguma coisa?</div>
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
            <br />a sua experiência conosco. Nada além disso.
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
          <div style={{ marginTop: 32 }}>
            <Link
              to="/auth"
              style={{ fontSize: 12, color: "var(--muted)", textDecoration: "underline" }}
            >
              Acesso da equipe
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
