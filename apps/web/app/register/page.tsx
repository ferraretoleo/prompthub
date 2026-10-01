"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          username: form.get("username"),
          email: form.get("email"),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Não foi possível criar a conta");
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

        <h1>Criar sua conta</h1>

        <p className="meta">
          Crie seu espaço para organizar, versionar e compartilhar prompts.
        </p>

        <div className="field">
          <label>Nome</label>
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" />
        </div>

        <div className="field">
          <label>Username</label>
          <input name="username" required minLength={3} maxLength={40} autoCapitalize="none" autoCorrect="off" />
        </div>

        <div className="field">
          <label>E-mail</label>
          <input name="email" type="email" required autoComplete="email" />
        </div>

        <div className="field">
          <label>Senha</label>
          <input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
        </div>

        <div className="field">
          <label>Confirmar senha</label>
          <input name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="primary" disabled={busy}>
          {busy ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="meta" style={{ textAlign: "center", marginTop: 18 }}>
          Já tem uma conta?{" "}
          <Link href="/login" style={{ color: "#58a6ff" }}>
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
