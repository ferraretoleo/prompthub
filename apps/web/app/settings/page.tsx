"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  KeyRound,
  Trash2
} from "lucide-react";
import AppShell from "@/components/AppShell";

type AiSettings = {
  provider: "OPENAI";
  useOwnKey: boolean;
  model: string;
  hasOwnKey: boolean;
};

export default function SettingsPage() {
  const router = useRouter();

  const [passwordMessage, setPasswordMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [ai, setAi] = useState<AiSettings>({
    provider: "OPENAI",
    useOwnKey: false,
    model: "gpt-5.6-luna",
    hasOwnKey: false
  });

  useEffect(() => {
    fetch("/api/proxy/ai-settings", {
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (data?.settings) {
          setAi(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  async function saveAiSettings(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setAiMessage("");

    const form = new FormData(event.currentTarget);
    const apiKey = String(form.get("apiKey") || "").trim();

    const response = await fetch(
      "/api/proxy/ai-settings",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          useOwnKey: ai.useOwnKey,
          model: form.get("model"),
          ...(apiKey ? { apiKey } : {})
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      setAi(data.settings);
      setAiMessage("Configuração de IA salva.");

      const input =
        event.currentTarget.elements.namedItem(
          "apiKey"
        ) as HTMLInputElement | null;

      if (input) input.value = "";
    } else {
      setAiMessage(
        data.error ||
        "Não foi possível salvar a configuração."
      );
    }

    setBusy(false);
  }

  async function removeAiKey() {
    setBusy(true);
    setAiMessage("");

    const response = await fetch(
      "/api/proxy/ai-settings/key",
      { method: "DELETE" }
    );

    if (
      response.ok ||
      response.status === 204
    ) {
      setAi((current) => ({
        ...current,
        useOwnKey: false,
        hasOwnKey: false
      }));

      setAiMessage(
        "Chave própria removida."
      );
    } else {
      setAiMessage(
        "Não foi possível remover a chave."
      );
    }

    setBusy(false);
  }

  async function changePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setPasswordMessage("");

    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") || "");
    const confirmation = String(form.get("confirmation") || "");

    if (newPassword !== confirmation) {
      setPasswordMessage(
        "As novas senhas não conferem."
      );
      setBusy(false);
      return;
    }

    const response = await fetch(
      "/api/proxy/auth/change-password",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword
        })
      }
    );

    const data = await response.json();

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
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setDeleteMessage("");

    const form = new FormData(event.currentTarget);

    const response = await fetch(
      "/api/proxy/auth/account",
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          password: form.get("password"),
          confirmation: form.get("confirmation")
        })
      }
    );

    if (
      response.ok ||
      response.status === 204
    ) {
      await fetch(
        "/api/auth/logout",
        { method: "POST" }
      );

      router.replace("/login");
      return;
    }

    const data = await response.json();

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
            <h1>Configurações</h1>
            <p>
              Segurança, conta e integração de Inteligência Artificial.
            </p>
          </div>
        </div>

        <div className="settingsGrid">
          <form
            className="panel"
            onSubmit={saveAiSettings}
          >
            <div className="panelHeader">
              <h3>
                <Bot size={16} />
                Inteligência Artificial
              </h3>
            </div>

            <div className="panelBody">
              <p className="meta">
                Use a chave da plataforma ou sua própria chave da OpenAI.
                A chave própria é criptografada antes de ser gravada e nunca
                volta para o navegador.
              </p>

              <div className="field">
                <label>Modo de execução</label>

                <select
                  value={
                    ai.useOwnKey
                      ? "OWN_KEY"
                      : "PLATFORM"
                  }
                  onChange={(event) =>
                    setAi((current) => ({
                      ...current,
                      useOwnKey:
                        event.target.value ===
                        "OWN_KEY"
                    }))
                  }
                >
                  <option value="PLATFORM">
                    Chave da plataforma
                  </option>

                  <option value="OWN_KEY">
                    Minha própria chave OpenAI
                  </option>
                </select>
              </div>

              <div className="field">
                <label>Modelo</label>

                <select
                  name="model"
                  value={ai.model}
                  onChange={(event) =>
                    setAi((current) => ({
                      ...current,
                      model: event.target.value
                    }))
                  }
                >
                  <option value="gpt-5.6-luna">
                    GPT-5.6 Luna
                  </option>

                  <option value="gpt-5.6-terra">
                    GPT-5.6 Terra
                  </option>

                  <option value="gpt-5.6-sol">
                    GPT-5.6 Sol
                  </option>
                </select>
              </div>

              {ai.useOwnKey && (
                <div className="field">
                  <label>
                    OpenAI API Key
                  </label>

                  <input
                    name="apiKey"
                    type="password"
                    autoComplete="off"
                    placeholder={
                      ai.hasOwnKey
                        ? "Chave já cadastrada. Preencha somente para substituir."
                        : "sk-..."
                    }
                  />

                  <span className="meta">
                    {ai.hasOwnKey
                      ? "Existe uma chave criptografada cadastrada."
                      : "Nenhuma chave própria cadastrada."}
                  </span>
                </div>
              )}

              {aiMessage && (
                <p className="meta">
                  {aiMessage}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap"
                }}
              >
                <button
                  className="buttonPrimary"
                  disabled={busy}
                >
                  Salvar IA
                </button>

                {ai.hasOwnKey && (
                  <button
                    type="button"
                    className="button buttonDanger"
                    onClick={removeAiKey}
                    disabled={busy}
                  >
                    Remover chave própria
                  </button>
                )}
              </div>
            </div>
          </form>

          <form
            className="panel"
            onSubmit={changePassword}
          >
            <div className="panelHeader">
              <h3>
                <KeyRound size={16} />
                Alterar senha
              </h3>
            </div>

            <div className="panelBody">
              <div className="field">
                <label>Senha atual</label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="field">
                <label>Nova senha</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </div>

              <div className="field">
                <label>
                  Confirmar nova senha
                </label>
                <input
                  name="confirmation"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </div>

              {passwordMessage && (
                <p className="meta">
                  {passwordMessage}
                </p>
              )}

              <button
                className="buttonPrimary"
                disabled={busy}
              >
                Salvar nova senha
              </button>
            </div>
          </form>

          <form
            className="panel dangerPanel"
            onSubmit={deleteAccount}
          >
            <div className="panelHeader">
              <h3>
                <Trash2 size={16} />
                Excluir conta
              </h3>
            </div>

            <div className="panelBody">
              <p className="meta">
                Esta operação remove sua conta, prompts,
                versões e favoritos. Não pode ser desfeita.
              </p>

              <div className="field">
                <label>Sua senha</label>
                <input
                  name="password"
                  type="password"
                  required
                />
              </div>

              <div className="field">
                <label>Digite EXCLUIR</label>
                <input
                  name="confirmation"
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
                className="button buttonDanger"
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
