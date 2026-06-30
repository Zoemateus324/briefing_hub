import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import "./briefing.css";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Acesso da equipe — Briefing" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError("E-mail ou senha inválidos.");
      navigate({ to: "/admin" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (data.session) navigate({ to: "/admin" });
      else setInfo("Conta criada. Verifique seu e-mail para confirmar o acesso.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 12,
            }}
          >
            Painel da Equipe
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 32,
              fontWeight: 400,
              color: "var(--sage)",
            }}
          >
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </h1>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && <p style={{ color: "var(--error)", fontSize: 13 }}>{error}</p>}
          {info && <p style={{ color: "var(--sage)", fontSize: 13 }}>{info}</p>}

          <button className="btn-submit" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            <span>{loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}</span>
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--muted)" }}>
          {mode === "signin" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--sage)",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {mode === "signin" ? "Criar conta" : "Entrar"}
          </button>
        </p>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
          <Link to="/" style={{ color: "var(--muted)" }}>
            ← Voltar ao briefing
          </Link>
        </p>
      </div>
    </div>
  );
}
