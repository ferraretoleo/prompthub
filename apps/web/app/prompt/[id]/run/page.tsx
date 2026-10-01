"use client";

import {
  FormEvent,
  use,
  useEffect,
  useMemo,
  useState
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Clock,
  Copy,
  Play,
  RotateCcw
} from "lucide-react";
import AppShell from "@/components/AppShell";

type ConfigData = {
  prompt: {
    id: string;
    title: string;
    description: string;
    content: string;
  };
  variables: string[];
  ai: {
    executionMode: "PLATFORM" | "OWN_KEY";
    model: string;
    dailyLimit: number;
  };
};

type RunHistory = {
  id: string;
  model: string;
  outputText?: string | null;
  status: string;
  errorMessage?: string | null;
  durationMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  executionMode?: "PLATFORM" | "OWN_KEY";
  createdAt: string;
};

export default function PromptRunPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);

  const [config, setConfig] =
    useState<ConfigData | null>(
      null
    );

  const [values, setValues] =
    useState<
      Record<string, string>
    >({});

  const [output, setOutput] =
    useState("");

  const [model, setModel] =
    useState("");

  const [history, setHistory] =
    useState<RunHistory[]>([]);

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  async function load() {
    const [
      configResponse,
      historyResponse
    ] = await Promise.all([
      fetch(
        `/api/proxy/runner/${id}/config`,
        {
          cache: "no-store"
        }
      ),
      fetch(
        `/api/proxy/runner/${id}/history`,
        {
          cache: "no-store"
        }
      )
    ]);

    if (configResponse.ok) {
      const data =
        await configResponse.json();

      setConfig(data);

      const initial:
        Record<
          string,
          string
        > = {};

      for (
        const variable of
        data.variables || []
      ) {
        initial[variable] =
          "";
      }

      setValues(initial);
    } else {
      const data =
        await configResponse.json();

      setError(
        data.error ||
          "Não foi possível carregar o prompt."
      );
    }

    if (
      historyResponse.ok
    ) {
      const data =
        await historyResponse.json();

      setHistory(
        data.items || []
      );
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const rendered =
    useMemo(() => {
      if (!config) {
        return "";
      }

      return config.prompt.content.replace(
        /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
        (_match, key) =>
          values[key] ?? ""
      );
    }, [
      config,
      values
    ]);

  async function run(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setOutput("");
    setModel("");

    try {
      const response =
        await fetch(
          `/api/proxy/runner/${id}/run`,
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                values
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Falha ao executar o prompt."
        );
        return;
      }

      setOutput(
        data.run
          .outputText || ""
      );

      setModel(
        data.run.model || ""
      );

      await load();
    } catch {
      setError(
        "Não foi possível conectar ao serviço de IA."
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyOutput() {
    if (!output) return;

    await navigator
      .clipboard
      .writeText(output);

    setCopied(true);

    setTimeout(
      () =>
        setCopied(false),
      1500
    );
  }

  if (!config) {
    return (
      <AppShell>
        <div className="contentWrap">
          <div className="empty">
            {error ||
              "Carregando Prompt Lab..."}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="pageHeader">
          <div className="pageTitleBlock">
            <h1>
              Prompt Lab
            </h1>

            <p>
              Teste “{config.prompt.title}” diretamente com IA.
              {" "}Modo: {config.ai.executionMode === "OWN_KEY"
                ? "chave própria"
                : "chave da plataforma"}
              {" · "}{config.ai.model}
              {" · "}limite diário {config.ai.dailyLimit}
            </p>
          </div>

          <Link
            href={`/prompt/${id}`}
            className="button"
          >
            <ArrowLeft
              size={15}
            />
            Voltar ao prompt
          </Link>
        </div>

        <form
          onSubmit={run}
          className="runnerGrid"
        >
          <div className="runnerMain">
            {config.variables
              .length > 0 && (
              <section className="panel">
                <div className="panelHeader">
                  <h3>
                    Variáveis
                  </h3>
                </div>

                <div className="panelBody runnerVariables">
                  {config.variables.map(
                    (
                      variable
                    ) => (
                      <div
                        className="field"
                        key={
                          variable
                        }
                      >
                        <label>
                          {
                            variable
                          }
                        </label>

                        <textarea
                          value={
                            values[
                              variable
                            ] ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            setValues(
                              (
                                current
                              ) => ({
                                ...current,
                                [variable]:
                                  event
                                    .target
                                    .value
                              })
                            )
                          }
                          style={{
                            minHeight:
                              90,
                            fontFamily:
                              "inherit"
                          }}
                          placeholder={`Valor para {{${variable}}}`}
                        />
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            <section className="panel">
              <div className="panelHeader">
                <h3>
                  Prompt final
                </h3>

                <span className="meta">
                  {
                    rendered.length
                  }{" "}
                  caracteres
                </span>
              </div>

              <div className="promptCodeWrap">
                <pre className="promptCode runnerPreview">
                  {rendered}
                </pre>
              </div>
            </section>

            {error && (
              <div className="runnerError">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="buttonPrimary runnerExecute"
              disabled={busy}
            >
              <Play size={16} />

              {busy
                ? "Executando..."
                : "Executar com IA"}
            </button>

            {output && (
              <section className="panel runnerResult">
                <div className="panelHeader">
                  <div>
                    <Bot
                      size={16}
                    />
                    <strong>
                      Resposta
                    </strong>

                    {model && (
                      <span className="meta">
                        {model}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="button"
                    onClick={
                      copyOutput
                    }
                  >
                    <Copy
                      size={15}
                    />
                    {copied
                      ? "Copiado"
                      : "Copiar"}
                  </button>
                </div>

                <div className="runnerOutput">
                  {output}
                </div>
              </section>
            )}
          </div>

          <aside className="runnerSide">
            <section className="panel">
              <div className="panelHeader">
                <h3>
                  <Clock
                    size={15}
                  />
                  Histórico
                </h3>
              </div>

              {history.length ? (
                <div className="runHistory">
                  {history.map(
                    (item) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        className="runHistoryItem"
                        onClick={() => {
                          if (
                            item.outputText
                          ) {
                            setOutput(
                              item.outputText
                            );
                            setModel(
                              item.model
                            );
                          }
                        }}
                      >
                        <strong>
                          {
                            item.model
                          }
                        </strong>

                        <span className="meta">
                          {new Date(
                            item.createdAt
                          ).toLocaleString(
                            "pt-BR"
                          )}
                        </span>

                        <span className="meta">
                          {item.status}
                          {item.executionMode
                            ? ` · ${item.executionMode === "OWN_KEY" ? "chave própria" : "plataforma"}`
                            : ""}
                          {item.durationMs
                            ? ` · ${item.durationMs} ms`
                            : ""}
                        </span>
                      </button>
                    )
                  )}
                </div>
              ) : (
                <div className="panelBody meta">
                  Nenhuma execução
                  ainda.
                </div>
              )}
            </section>

            <button
              type="button"
              className="button"
              onClick={() => {
                setOutput("");
                setModel("");
                setError("");
              }}
            >
              <RotateCcw
                size={15}
              />
              Limpar resultado
            </button>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}
