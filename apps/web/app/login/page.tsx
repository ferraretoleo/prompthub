"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Falha no login");
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError("Não foi possível conectar ao servidor");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authpage">
      <form className="authbox" onSubmit={submit}>
        <div className="brand">
          <img src="/icons/icon-192.png" alt="PromptHub" />
          <span>PromptHub</span>
        </div>

        <h1>Entrar no PromptHub</h1>

        <p className="meta">
          Acesse seus prompts e descubra conteúdos compartilhados pela comunidade.
        </p>

        <div className="field">
          <label>E-mail</label>
          <input name="email" type="email" required autoComplete="email" />
        </div>

        <div className="field">
          <label>Senha</label>
          <input name="password" type="password" required autoComplete="current-password" />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="primary" disabled={busy}>
          {busy ? "Entrando..." : "Entrar"}
        </button>

        <p className="meta" style={{ textAlign: "center", marginTop: 18 }}>
          Ainda não tem conta?{" "}
          <Link href="/register" style={{ color: "#58a6ff" }}>
            Criar conta
          </Link>
        </p>
      </form>
    </main>
  );
}
