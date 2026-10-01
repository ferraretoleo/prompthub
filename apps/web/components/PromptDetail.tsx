"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  GitFork,
  Heart,
  History,
  Lock,
  Globe2,
  Pencil,
  Trash2
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import VersionHistory, {
  type PromptVersion
} from "@/components/VersionHistory";

type PromptDetailData = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  visibility: "PRIVATE" | "PUBLIC";
  currentVersion: number;
  viewsCount: number;
  forksCount: number;
  favoritesCount: number;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorUsername: string;
  categoryName?: string | null;
  tags?: string[];
  isOwner: boolean;
  isFavorite: boolean;
};

export default function PromptDetail({
  promptId
}: {
  promptId: string;
}) {
  const router = useRouter();

  const [prompt, setPrompt] =
    useState<PromptDetailData | null>(null);

  const [versions, setVersions] =
    useState<PromptVersion[]>([]);

  const [displayContent, setDisplayContent] =
    useState("");

  const [displayVersion, setDisplayVersion] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [copied, setCopied] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showReport, setShowReport] =
    useState(false);

  const [reportMessage, setReportMessage] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch(
            `/api/proxy/prompts/${promptId}`,
            {
              cache: "no-store"
            }
          );

        if (
          response.status ===
          401
        ) {
          router.replace(
            "/login"
          );
          return;
        }

        if (
          response.status ===
          404
        ) {
          setError(
            "Prompt não encontrado ou você não possui acesso."
          );
          setLoading(false);
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              "Não foi possível carregar o prompt"
          );
          setLoading(false);
          return;
        }

        setPrompt(
          data.prompt
        );

        setDisplayContent(
          data.prompt.content
        );

        setDisplayVersion(
          data.prompt.currentVersion
        );

        const versionsResponse =
          await fetch(
            `/api/proxy/prompts/${promptId}/versions`,
            {
              cache: "no-store"
            }
          );

        if (
          versionsResponse.ok
        ) {
          const versionsData =
            await versionsResponse.json();

          setVersions(
            versionsData.items ||
              []
          );
        }
      } catch {
        setError(
          "Não foi possível conectar ao servidor."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [
    promptId,
    router
  ]);

  async function copyPrompt() {
    if (!displayContent) {
      return;
    }

    await navigator
      .clipboard
      .writeText(
        displayContent
      );

    setCopied(true);

    window.setTimeout(
      () =>
        setCopied(
          false
        ),
      1600
    );
  }

  async function toggleFavorite() {
    if (
      !prompt ||
      prompt.isOwner
    ) {
      return;
    }

    setBusy(true);

    try {
      const response =
        await fetch(
          `/api/proxy/prompts/${prompt.id}/favorite`,
          {
            method: "POST"
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Não foi possível alterar o favorito"
        );
        return;
      }

      setPrompt(
        (current) => {
          if (!current) {
            return current;
          }

          const delta =
            data.favorite
              ? 1
              : -1;

          return {
            ...current,
            isFavorite:
              data.favorite,
            favoritesCount:
              Math.max(
                0,
                current
                  .favoritesCount +
                  delta
              )
          };
        }
      );
    } finally {
      setBusy(false);
    }
  }

  async function forkPrompt() {
    if (!prompt) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/proxy/prompts/${prompt.id}/fork`,
          {
            method:
              "POST"
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Não foi possível criar o fork"
        );
        return;
      }

      router.push(
        `/prompt/${data.prompt.id}/edit`
      );
    } finally {
      setBusy(false);
    }
  }

  async function deletePrompt() {
    if (!prompt?.isOwner) {
      return;
    }

    const confirmed =
      window.confirm(
        "Excluir este prompt? O prompt deixará de aparecer no PromptHub."
      );

    if (!confirmed) {
      return;
    }

    setBusy(true);

    try {
      const response =
        await fetch(
          `/api/proxy/prompts/${prompt.id}`,
          {
            method:
              "DELETE"
          }
        );

      if (
        !response.ok &&
        response.status !==
          204
      ) {
        const data =
          await response.json();

        setError(
          data.error ||
            "Não foi possível excluir o prompt"
        );
        return;
      }

      router.replace(
        "/dashboard?scope=mine"
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!prompt) {
      return;
    }

    setBusy(true);
    setReportMessage("");

    const form =
      new FormData(
        event.currentTarget
      );

    const response =
      await fetch(
        "/api/proxy/reports",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            promptId:
              prompt.id,
            reason:
              form.get(
                "reason"
              ),
            description:
              form.get(
                "description"
              ) ||
              null
          })
        }
      );

    const data =
      await response.json();

    if (response.ok) {
      setReportMessage(
        "Denúncia enviada para análise."
      );
    } else {
      setReportMessage(
        data.error ||
          "Não foi possível enviar a denúncia."
      );
    }

    setBusy(false);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="contentWrap">
          <div className="empty">
            Carregando prompt...
          </div>
        </div>
      </AppShell>
    );
  }

  if (
    !prompt ||
    error
  ) {
    return (
      <AppShell>
        <div className="contentWrap">
          <div className="empty">
            {error ||
              "Prompt não encontrado."}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="repoBreadcrumb">
          <Link href="/dashboard">
            PromptHub
          </Link>
          <span>/</span>
          <span>
            {
              prompt
                .authorUsername
            }
          </span>
          <span>/</span>
          <strong>
            {prompt.slug}
          </strong>
        </div>

        <div className="pageHeader promptDetailHeader">
          <div className="pageTitleBlock">
            <div className="promptDetailTitleLine">
              <h1>
                {prompt.title}
              </h1>

              <span
                className={`badge ${
                  prompt.visibility ===
                  "PUBLIC"
                    ? "public"
                    : "private"
                }`}
              >
                {prompt.visibility ===
                "PUBLIC" ? (
                  <>
                    <Globe2
                      size={12}
                    />
                    Público
                  </>
                ) : (
                  <>
                    <Lock
                      size={12}
                    />
                    Privado
                  </>
                )}
              </span>
            </div>

            <p>
              {
                prompt
                  .description
              }
            </p>
          </div>

          <div className="pageActions">
            {prompt.isOwner && (
              <Link
                href={`/prompt/${prompt.id}/edit`}
                className="button"
              >
                <Pencil
                  size={15}
                />
                Editar
              </Link>
            )}

            {prompt.isOwner && (
              <button
                type="button"
                className="button buttonDanger"
                onClick={
                  deletePrompt
                }
                disabled={busy}
              >
                <Trash2
                  size={15}
                />
                Excluir
              </button>
            )}

            {!prompt.isOwner &&
              prompt.visibility ===
                "PUBLIC" && (
                <>
                  <button
                    type="button"
                    className="button"
                    onClick={
                      toggleFavorite
                    }
                    disabled={busy}
                  >
                    <Heart
                      size={15}
                      fill={
                        prompt
                          .isFavorite
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {prompt.isFavorite
                      ? "Favoritado"
                      : "Favoritar"}
                  </button>

                  <button
                    type="button"
                    className="button"
                    onClick={
                      forkPrompt
                    }
                    disabled={busy}
                  >
                    <GitFork
                      size={15}
                    />
                    Fork
                  </button>

                  <button
                    type="button"
                    className="button"
                    onClick={() =>
                      setShowReport(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                  >
                    <AlertTriangle
                      size={15}
                    />
                    Denunciar
                  </button>
                </>
              )}
          </div>
        </div>

        <div className="promptStatsBar">
          <span>
            @
            {
              prompt
                .authorUsername
            }
          </span>

          <span>
            <Eye
              size={14}
            />
            {
              prompt
                .viewsCount
            }{" "}
            visualizações
          </span>

          <span>
            <Heart
              size={14}
            />
            {
              prompt
                .favoritesCount
            }{" "}
            favoritos
          </span>

          <span>
            <GitFork
              size={14}
            />
            {
              prompt
                .forksCount
            }{" "}
            forks
          </span>

          {prompt.categoryName && (
            <span>
              Categoria:{" "}
              {
                prompt
                  .categoryName
              }
            </span>
          )}
        </div>

        {showReport &&
          !prompt.isOwner &&
          prompt.visibility ===
            "PUBLIC" && (
            <form
              className="reportBox"
              onSubmit={
                submitReport
              }
            >
              <strong>
                Denunciar este prompt
              </strong>

              <div className="field">
                <label>
                  Motivo
                </label>

                <select
                  name="reason"
                  defaultValue="SPAM"
                >
                  <option value="SPAM">
                    Spam
                  </option>
                  <option value="INAPPROPRIATE">
                    Conteúdo inadequado
                  </option>
                  <option value="MISLEADING">
                    Conteúdo enganoso
                  </option>
                  <option value="COPYRIGHT">
                    Direitos autorais
                  </option>
                  <option value="OTHER">
                    Outro
                  </option>
                </select>
              </div>

              <div className="field">
                <label>
                  Detalhes
                </label>

                <textarea
                  name="description"
                  maxLength={1000}
                  placeholder="Descreva o motivo da denúncia."
                />
              </div>

              {reportMessage && (
                <p className="meta">
                  {
                    reportMessage
                  }
                </p>
              )}

              <button
                className="button buttonDanger"
                disabled={busy}
              >
                Enviar denúncia
              </button>
            </form>
          )}

        {prompt.tags?.length ? (
          <div
            className="tags"
            style={{
              marginBottom: 16
            }}
          >
            {prompt.tags.map(
              (tag) => (
                <span
                  key={tag}
                  className="tag"
                >
                  #{tag}
                </span>
              )
            )}
          </div>
        ) : null}

        <div className="promptDetailGrid">
          <section className="panel">
            <div className="panelHeader">
              <div>
                <strong>
                  Prompt
                </strong>

                <span className="meta promptVersionLabel">
                  versão{" "}
                  {
                    displayVersion
                  }
                </span>
              </div>

              <button
                type="button"
                className="button"
                onClick={
                  copyPrompt
                }
              >
                {copied ? (
                  <>
                    <Check
                      size={15}
                    />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy
                      size={15}
                    />
                    Copiar prompt
                  </>
                )}
              </button>
            </div>

            <div className="promptCodeWrap">
              <pre className="promptCode">
                {
                  displayContent
                }
              </pre>
            </div>
          </section>

          <aside className="promptSideColumn">
            <section className="panel">
              <div className="panelHeader">
                <h3>
                  <History
                    size={15}
                  />
                  Histórico
                </h3>
              </div>

              <VersionHistory
                items={versions}
                onSelect={(
                  item
                ) => {
                  setDisplayContent(
                    item.content
                  );
                  setDisplayVersion(
                    item.version
                  );
                }}
              />
            </section>

            {displayVersion !==
              prompt.currentVersion && (
              <button
                type="button"
                className="button promptCurrentButton"
                onClick={() => {
                  setDisplayContent(
                    prompt.content
                  );
                  setDisplayVersion(
                    prompt.currentVersion
                  );
                }}
              >
                Voltar para versão atual
              </button>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
