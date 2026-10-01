"use client";

import {
  FormEvent,
  useState
} from "react";
import {
  useRouter
} from "next/navigation";
import {
  KeyRound,
  Trash2
} from "lucide-react";
import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  const router = useRouter();

  const [
    passwordMessage,
    setPasswordMessage
  ] = useState("");

  const [
    deleteMessage,
    setDeleteMessage
  ] = useState("");

  const [busy, setBusy] =
    useState(false);

  async function changePassword(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setPasswordMessage("");

    const form =
      new FormData(
        event.currentTarget
      );

    const newPassword =
      String(
        form.get(
          "newPassword"
        ) || ""
      );

    const confirmation =
      String(
        form.get(
          "confirmation"
        ) || ""
      );

    if (
      newPassword !==
      confirmation
    ) {
      setPasswordMessage(
        "As novas senhas não conferem."
      );
      setBusy(false);
      return;
    }

    const response =
      await fetch(
        "/api/proxy/auth/change-password",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            currentPassword:
              form.get(
                "currentPassword"
              ),
            newPassword
          })
        }
      );

    const data =
      await response.json();

    setPasswordMessage(
      data.message ||
        data.error ||
        "Operação concluída."
    );

    if (response.ok) {
      event.currentTarget.reset();
    }

    setBusy(false);
  }

  async function deleteAccount(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setDeleteMessage("");

    const form =
      new FormData(
        event.currentTarget
      );

    const response =
      await fetch(
        "/api/proxy/auth/account",
        {
          method: "DELETE",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            password:
              form.get("password"),
            confirmation:
              form.get(
                "confirmation"
              )
          })
        }
      );

    if (
      response.ok ||
      response.status === 204
    ) {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST"
        }
      );

      router.replace(
        "/login"
      );

      return;
    }

    const data =
      await response.json();

    setDeleteMessage(
      data.error ||
        "Não foi possível excluir a conta."
    );

    setBusy(false);
  }

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="pageHeader">
          <div className="pageTitleBlock">
            <h1>
              Configurações
            </h1>
            <p>
              Segurança e controle da
              sua conta.
            </p>
          </div>
        </div>

        <div className="settingsGrid">
          <form
            className="panel"
            onSubmit={
              changePassword
            }
          >
            <div className="panelHeader">
              <h3>
                <KeyRound
                  size={16}
                />
                Alterar senha
              </h3>
            </div>

            <div className="panelBody">
              <div className="field">
                <label>
                  Senha atual
                </label>
                <input
                  name=
                    "currentPassword"
                  type="password"
                  required
                  autoComplete=
                    "current-password"
                />
              </div>

              <div className="field">
                <label>
                  Nova senha
                </label>
                <input
                  name=
                    "newPassword"
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
                  Confirmar nova
                  senha
                </label>
                <input
                  name=
                    "confirmation"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete=
                    "new-password"
                />
              </div>

              {passwordMessage && (
                <p className="meta">
                  {
                    passwordMessage
                  }
                </p>
              )}

              <button
                className=
                  "buttonPrimary"
                disabled={busy}
              >
                Salvar nova senha
              </button>
            </div>
          </form>

          <form
            className=
              "panel dangerPanel"
            onSubmit={
              deleteAccount
            }
          >
            <div className="panelHeader">
              <h3>
                <Trash2
                  size={16}
                />
                Excluir conta
              </h3>
            </div>

            <div className="panelBody">
              <p className="meta">
                Esta operação remove
                sua conta, prompts,
                versões e favoritos.
                Não pode ser desfeita.
              </p>

              <div className="field">
                <label>
                  Sua senha
                </label>
                <input
                  name="password"
                  type="password"
                  required
                />
              </div>

              <div className="field">
                <label>
                  Digite EXCLUIR
                </label>
                <input
                  name=
                    "confirmation"
                  required
                  pattern="EXCLUIR"
                />
              </div>

              {deleteMessage && (
                <p className="error">
                  {deleteMessage}
                </p>
              )}

              <button
                className=
                  "button buttonDanger"
                disabled={busy}
              >
                Excluir minha conta
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
