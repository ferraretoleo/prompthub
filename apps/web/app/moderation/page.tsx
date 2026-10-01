"use client";

import {
  useEffect,
  useState
} from "react";
import {
  ShieldCheck,
  EyeOff,
  RefreshCw
} from "lucide-react";
import AppShell from "@/components/AppShell";

type ReportItem = {
  id: string;
  promptId: string;
  reason: string;
  description?: string | null;
  status:
    | "OPEN"
    | "REVIEWING"
    | "RESOLVED"
    | "DISMISSED";
  createdAt: string;
  promptTitle: string;
  promptVisibility: string;
  promptDeletedAt?: string | null;
  reporter?: {
    username: string;
    name: string;
  } | null;
  owner?: {
    username: string;
    name: string;
  } | null;
};

export default function ModerationPage() {
  const [items, setItems] =
    useState<ReportItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const query =
        status
          ? `?status=${encodeURIComponent(status)}`
          : "";

      const response =
        await fetch(
          `/api/proxy/reports/moderation${query}`,
          {
            cache:
              "no-store"
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Não foi possível carregar a moderação."
        );
        return;
      }

      setItems(
        data.items ||
          []
      );
    } catch {
      setError(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  async function updateStatus(
    id: string,
    nextStatus:
      ReportItem["status"]
  ) {
    const response =
      await fetch(
        `/api/proxy/reports/moderation/${id}`,
        {
          method:
            "PATCH",
          headers: {
            "content-type":
              "application/json"
          },
          body:
            JSON.stringify({
              status:
                nextStatus
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      setError(
        data.error ||
          "Não foi possível atualizar a denúncia."
      );
      return;
    }

    await load();
  }

  async function unpublish(
    item: ReportItem
  ) {
    const confirmed =
      window.confirm(
        `Despublicar o prompt "${item.promptTitle}"? Ele passará para PRIVADO.`
      );

    if (!confirmed) {
      return;
    }

    const response =
      await fetch(
        `/api/proxy/reports/moderation/${item.id}/unpublish`,
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
          "Não foi possível despublicar o prompt."
      );
      return;
    }

    await load();
  }

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="pageHeader">
          <div className="pageTitleBlock">
            <h1>
              <ShieldCheck
                size={24}
              />
              Moderação
            </h1>
            <p>
              Analise denúncias de prompts públicos.
            </p>
          </div>

          <button
            type="button"
            className="button"
            onClick={
              load
            }
          >
            <RefreshCw
              size={15}
            />
            Atualizar
          </button>
        </div>

        <div className="moderationFilters">
          <button
            className={`button ${
              !status
                ? "buttonPrimary"
                : ""
            }`}
            onClick={() =>
              setStatus("")
            }
          >
            Todas
          </button>

          {[
            "OPEN",
            "REVIEWING",
            "RESOLVED",
            "DISMISSED"
          ].map(
            (value) => (
              <button
                key={value}
                className={`button ${
                  status === value
                    ? "buttonPrimary"
                    : ""
                }`}
                onClick={() =>
                  setStatus(
                    value
                  )
                }
              >
                {value}
              </button>
            )
          )}
        </div>

        {error && (
          <div className="runnerError">
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty">
            Carregando denúncias...
          </div>
        ) : items.length ===
          0 ? (
          <div className="empty">
            Nenhuma denúncia encontrada.
          </div>
        ) : (
          <div className="moderationList">
            {items.map(
              (item) => (
                <article
                  key={item.id}
                  className="panel moderationCard"
                >
                  <div className="panelHeader">
                    <div>
                      <strong>
                        {
                          item.promptTitle
                        }
                      </strong>

                      <span className={`moderationStatus status-${item.status.toLowerCase()}`}>
                        {
                          item.status
                        }
                      </span>
                    </div>

                    <span className="meta">
                      {new Date(
                        item.createdAt
                      ).toLocaleString(
                        "pt-BR"
                      )}
                    </span>
                  </div>

                  <div className="panelBody">
                    <div className="moderationMeta">
                      <span>
                        Motivo:{" "}
                        <strong>
                          {
                            item.reason
                          }
                        </strong>
                      </span>

                      <span>
                        Autor:{" "}
                        <strong>
                          @
                          {
                            item.owner
                              ?.username ||
                            "indisponível"
                          }
                        </strong>
                      </span>

                      <span>
                        Denúncia por:{" "}
                        <strong>
                          @
                          {
                            item.reporter
                              ?.username ||
                            "usuário removido"
                          }
                        </strong>
                      </span>

                      <span>
                        Visibilidade:{" "}
                        <strong>
                          {
                            item.promptVisibility
                          }
                        </strong>
                      </span>
                    </div>

                    {item.description && (
                      <p className="moderationDescription">
                        {
                          item.description
                        }
                      </p>
                    )}

                    <div className="moderationActions">
                      <button
                        type="button"
                        className="button"
                        onClick={() =>
                          updateStatus(
                            item.id,
                            "REVIEWING"
                          )
                        }
                      >
                        Em análise
                      </button>

                      <button
                        type="button"
                        className="button"
                        onClick={() =>
                          updateStatus(
                            item.id,
                            "RESOLVED"
                          )
                        }
                      >
                        Resolver
                      </button>

                      <button
                        type="button"
                        className="button"
                        onClick={() =>
                          updateStatus(
                            item.id,
                            "DISMISSED"
                          )
                        }
                      >
                        Descartar
                      </button>

                      {item.promptVisibility ===
                        "PUBLIC" && (
                        <button
                          type="button"
                          className="button buttonDanger"
                          onClick={() =>
                            unpublish(
                              item
                            )
                          }
                        >
                          <EyeOff
                            size={15}
                          />
                          Despublicar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
