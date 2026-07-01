import { createFileRoute, Link } from "@tanstack/react-router";
import "./briefing.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Briefing de Experiência" },
      {
        name: "description",
        content:
          "Acesse o briefing personalizado da sua loja pelo link enviado.",
      },
      { property: "og:title", content: "Briefing de Experiência" },
      {
        property: "og:description",
        content: "Cada loja possui um link único para o briefing personalizado.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <div className="header">
        <div className="header-eyebrow">Experiência Personalizada</div>
        <h1>
          Cada detalhe importa.
          <br />
          <em>Bem-vindo(a).</em>
        </h1>
        <p>
          Para preencher o formulário, use o link exclusivo da loja que você foi convidado(a)
          a conhecer.
        </p>
      </div>

      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "40px 24px 80px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
          O formulário é único por loja e enviado diretamente pela equipe.
          <br />
          Se você é da equipe, acesse o painel abaixo.
        </p>
        <div style={{ marginTop: 32 }}>
          <Link
            to="/auth"
            style={{ fontSize: 13, color: "var(--sage)", textDecoration: "underline" }}
          >
            Acesso da equipe
          </Link>
        </div>
      </div>
    </>
  );
}
