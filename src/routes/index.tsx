import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
      {
        property: "og:title",
        content: "Briefing de Experiência — Bem-vindo(a)",
      },
      {
        property: "og:description",
        content:
          "Briefing personalizado para preparar sua experiência — do cardápio à trilha sonora.",
      },
    ],
  }),
  component: HomePage,
});

type Loja = { id: string; nome: string; slug: string };

function HomePage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("lojas")
        .select("id, nome, slug")
        .order("nome", { ascending: true });
      setLojas(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <div className="header">
        <div className="header-eyebrow">Experiência Personalizada</div>
        <h1>
          Cada detalhe importa.
          <br />
          <em>Escolha sua loja para começar.</em>
        </h1>
        <p>
          Selecione abaixo a loja onde sua experiência vai acontecer para
          preencher o briefing certo.
        </p>
      </div>

      <div className="form-container">
        {loading ? (
          <div
            style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}
          >
            Carregando...
          </div>
        ) : lojas.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--muted)",
              marginTop: 32,
            }}
          >
            Nenhuma loja cadastrada ainda.
          </div>
        ) : (
          <div className="radio-cards" style={{ marginTop: 32 }}>
            {lojas.map((l) => (
              <Link
                key={l.id}
                to="/loja/$slug"
                params={{ slug: l.slug }}
                className="radio-card"
                style={{ textDecoration: "none" }}
              >
                <div className="rc-label">{l.nome}</div>
              </Link>
            ))}
          </div>
        )}

        <div className="submit-section">
          <Link
            to="/auth"
            style={{
              fontSize: 12,
              color: "var(--muted)",
              textDecoration: "underline",
            }}
          >
            Acesso da equipe
          </Link>
        </div>
      </div>
    </>
  );
}
