"use client";

import {
  FormEvent,
  useState
} from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [busy, setBusy] =
    useState(false);
  const [message, setMessage] =
    useState("");

  async function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const form =
      new FormData(
        event.currentTarget
      );

    try {
      const response =
        await fetch(
          "/api/proxy/auth/forgot-password",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body: JSON.stringify({
              email:
                form.get("email")
            })
          }
        );

      const data =
        await response.json();

      setMessage(
        data.message ||
          "Se o e-mail estiver cadastrado, enviaremos as instruções."
      );
    } catch {
      setMessage(
        "Não foi possível processar a solicitação."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authpage">
      <form
        className="authbox"
        onSubmit={submit}
      >
        <div className="brand">
          <img
            src="/icons/icon-192.png"
            alt="PromptHub"
          />
          <span>
            PromptHub
          </span>
        </div>

        <h1>
          Recuperar senha
        </h1>

        <p className="meta">
          Informe seu e-mail.
          Enviaremos um link válido
          por 30 minutos.
        </p>

        <div className="field">
          <label>E-mail</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        {message && (
          <p className="meta">
            {message}
          </p>
        )}

        <button
          className="primary"
          disabled={busy}
        >
          {busy
            ? "Enviando..."
            : "Enviar instruções"}
        </button>

        <p
          className="meta"
          style={{
            textAlign: "center",
            marginTop: 18
          }}
        >
          <Link
            href="/login"
            style={{
              color: "#58a6ff"
            }}
          >
            Voltar ao login
          </Link>
        </p>
      </form>
    </main>
  );
}
