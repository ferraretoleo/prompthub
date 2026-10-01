"use client";

import {
  FormEvent,
  Suspense,
  useState
} from "react";
import {
  useRouter,
  useSearchParams
} from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const params =
    useSearchParams();
  const router =
    useRouter();

  const token =
    params.get("token") || "";

  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState("");

  async function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const form =
      new FormData(
        event.currentTarget
      );

    const password =
      String(
        form.get("password") ||
          ""
      );

    const confirmation =
      String(
        form.get(
          "confirmation"
        ) || ""
      );

    if (
      password !==
      confirmation
    ) {
      setError(
        "As senhas não conferem"
      );
      setBusy(false);
      return;
    }

    const response =
      await fetch(
        "/api/proxy/auth/reset-password",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            token,
            password
          })
        }
      );

    const data =
      await response.json();

    setBusy(false);

    if (!response.ok) {
      setError(
        data.error ||
          "Não foi possível redefinir a senha"
      );
      return;
    }

    router.replace(
      "/login"
    );
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
          Nova senha
        </h1>

        {!token && (
          <p className="error">
            Link de recuperação
            inválido.
          </p>
        )}

        <div className="field">
          <label>
            Nova senha
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete=
              "new-password"
          />
        </div>

        <div className="field">
          <label>
            Confirmar senha
          </label>
          <input
            name="confirmation"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete=
              "new-password"
          />
        </div>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <button
          className="primary"
          disabled={
            busy || !token
          }
        >
          {busy
            ? "Salvando..."
            : "Redefinir senha"}
        </button>

        <p
          className="meta"
          style={{
            textAlign:
              "center",
            marginTop: 18
          }}
        >
          <Link
            href="/login"
            style={{
              color:
                "#58a6ff"
            }}
          >
            Voltar ao login
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
