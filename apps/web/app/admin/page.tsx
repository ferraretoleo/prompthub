"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";
import {
  Activity,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  FileText,
  Globe2,
  Lock,
  AlertTriangle
} from "lucide-react";
import AppShell from "@/components/AppShell";

type Summary = {
  users: number;
  activeUsers: number;
  publicPrompts: number;
  privatePrompts: number;
  openReports: number;
};

type UserItem = {
  id: string;
  name: string;
  username: string;
  email: string;
  role:
    | "USER"
    | "MODERATOR"
    | "ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AuditItem = {
  id: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  details?: unknown;
  createdAt: string;
  username?: string | null;
  name?: string | null;
};

export default function AdminPage() {
  const [
    summary,
    setSummary
  ] =
    useState<Summary | null>(
      null
    );

  const [
    users,
    setUsers
  ] =
    useState<UserItem[]>(
      []
    );

  const [
    audit,
    setAudit
  ] =
    useState<AuditItem[]>(
      []
    );

  const [
    tab,
    setTab
  ] =
    useState<
      "users" |
      "audit"
    >("users");

  const [
    query,
    setQuery
  ] =
    useState("");

  const [
    error,
    setError
  ] =
    useState("");

  const [
    loading,
    setLoading
  ] =
    useState(true);

  async function loadSummary() {
    const response =
      await fetch(
        "/api/proxy/admin/summary",
        {
          cache:
            "no-store"
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Não foi possível carregar o resumo."
      );
    }

    setSummary(
      data.summary
    );
  }

  async function loadUsers(
    q = ""
  ) {
    const queryString =
      q.trim()
        ? `?q=${encodeURIComponent(q.trim())}`
        : "";

    const response =
      await fetch(
        `/api/proxy/admin/users${queryString}`,
        {
          cache:
            "no-store"
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Não foi possível carregar os usuários."
      );
    }

    setUsers(
      data.items ||
        []
    );
  }

  async function loadAudit() {
    const response =
      await fetch(
        "/api/proxy/admin/audit?limit=100",
        {
          cache:
            "no-store"
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Não foi possível carregar a auditoria."
      );
    }

    setAudit(
      data.items ||
        []
    );
  }

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadSummary(),
        loadUsers(query),
        loadAudit()
      ]);
    } catch (
      loadError
    ) {
      setError(
        loadError instanceof
          Error
          ? loadError.message
          : "Erro ao carregar a administração."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function searchUsers(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      await loadUsers(
        query
      );
    } catch (
      searchError
    ) {
      setError(
        searchError instanceof
          Error
          ? searchError.message
          : "Erro na pesquisa."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(
    userId: string,
    patch: {
      role?:
        UserItem["role"];
      isActive?:
        boolean;
    }
  ) {
    setError("");

    const response =
      await fetch(
        `/api/proxy/admin/users/${userId}`,
        {
          method:
            "PATCH",
          headers: {
            "content-type":
              "application/json"
          },
          body:
            JSON.stringify(
              patch
            )
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      setError(
        data.error ||
          "Não foi possível atualizar o usuário."
      );
      return;
    }

    setUsers(
      (
        current
      ) =>
        current.map(
          (item) =>
            item.id ===
            userId
              ? {
                  ...item,
                  ...data.user
                }
              : item
        )
    );

    await Promise.all([
      loadSummary(),
      loadAudit()
    ]);
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
              Administração
            </h1>

            <p>
              Controle de usuários, perfis e auditoria do PromptHub.
            </p>
          </div>

          <button
            type="button"
            className="button"
            onClick={
              loadAll
            }
          >
            <RefreshCw
              size={15}
            />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="adminError">
            {error}
          </div>
        )}

        {summary && (
          <div className="adminStats">
            <div className="adminStat">
              <Users
                size={20}
              />
              <div>
                <strong>
                  {
                    summary.users
                  }
                </strong>
                <span>
                  Usuários
                </span>
              </div>
            </div>

            <div className="adminStat">
              <Activity
                size={20}
              />
              <div>
                <strong>
                  {
                    summary.activeUsers
                  }
                </strong>
                <span>
                  Ativos
                </span>
              </div>
            </div>

            <div className="adminStat">
              <Globe2
                size={20}
              />
              <div>
                <strong>
                  {
                    summary.publicPrompts
                  }
                </strong>
                <span>
                  Públicos
                </span>
              </div>
            </div>

            <div className="adminStat">
              <Lock
                size={20}
              />
              <div>
                <strong>
                  {
                    summary.privatePrompts
                  }
                </strong>
                <span>
                  Privados
                </span>
              </div>
            </div>

            <div className="adminStat">
              <AlertTriangle
                size={20}
              />
              <div>
                <strong>
                  {
                    summary.openReports
                  }
                </strong>
                <span>
                  Denúncias abertas
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="adminTabs">
          <button
            type="button"
            className={`button ${
              tab ===
              "users"
                ? "buttonPrimary"
                : ""
            }`}
            onClick={() =>
              setTab(
                "users"
              )
            }
          >
            <Users
              size={15}
            />
            Usuários
          </button>

          <button
            type="button"
            className={`button ${
              tab ===
              "audit"
                ? "buttonPrimary"
                : ""
            }`}
            onClick={() =>
              setTab(
                "audit"
              )
            }
          >
            <FileText
              size={15}
            />
            Auditoria
          </button>
        </div>

        {tab ===
          "users" && (
          <>
            <form
              className="adminSearch"
              onSubmit={
                searchUsers
              }
            >
              <Search
                size={16}
              />

              <input
                value={query}
                onChange={(
                  event
                ) =>
                  setQuery(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Nome, usuário ou e-mail"
              />

              <button
                className="button"
                disabled={
                  loading
                }
              >
                Pesquisar
              </button>
            </form>

            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>
                      Usuário
                    </th>
                    <th>
                      E-mail
                    </th>
                    <th>
                      Perfil
                    </th>
                    <th>
                      Status
                    </th>
                    <th>
                      Cadastro
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map(
                    (
                      user
                    ) => (
                      <tr
                        key={
                          user.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              user.name
                            }
                          </strong>
                          <span className="adminSub">
                            @
                            {
                              user.username
                            }
                          </span>
                        </td>

                        <td>
                          {
                            user.email
                          }
                        </td>

                        <td>
                          <select
                            value={
                              user.role
                            }
                            onChange={(
                              event
                            ) =>
                              updateUser(
                                user.id,
                                {
                                  role:
                                    event
                                      .target
                                      .value as UserItem["role"]
                                }
                              )
                            }
                          >
                            <option value="USER">
                              USER
                            </option>
                            <option value="MODERATOR">
                              MODERATOR
                            </option>
                            <option value="ADMIN">
                              ADMIN
                            </option>
                          </select>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`button ${
                              user.isActive
                                ? ""
                                : "buttonDanger"
                            }`}
                            onClick={() =>
                              updateUser(
                                user.id,
                                {
                                  isActive:
                                    !user.isActive
                                }
                              )
                            }
                          >
                            {user.isActive
                              ? "Ativo"
                              : "Inativo"}
                          </button>
                        </td>

                        <td>
                          {new Date(
                            user.createdAt
                          ).toLocaleDateString(
                            "pt-BR"
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab ===
          "audit" && (
          <div className="auditList">
            {audit.map(
              (
                item
              ) => (
                <article
                  key={
                    item.id
                  }
                  className="panel auditItem"
                >
                  <div className="auditItemTop">
                    <strong>
                      {
                        item.action
                      }
                    </strong>

                    <span className="meta">
                      {new Date(
                        item.createdAt
                      ).toLocaleString(
                        "pt-BR"
                      )}
                    </span>
                  </div>

                  <div className="auditMeta">
                    <span>
                      Usuário:{" "}
                      <strong>
                        {item.username
                          ? `@${item.username}`
                          : "sistema/usuário removido"}
                      </strong>
                    </span>

                    {item.entityType && (
                      <span>
                        Entidade:{" "}
                        <strong>
                          {
                            item.entityType
                          }
                        </strong>
                      </span>
                    )}

                    {item.entityId && (
                      <span>
                        ID:{" "}
                        <code>
                          {
                            item.entityId
                          }
                        </code>
                      </span>
                    )}

                    {item.ipAddress && (
                      <span>
                        IP:{" "}
                        <code>
                          {
                            item.ipAddress
                          }
                        </code>
                      </span>
                    )}
                  </div>

                  {item.details && (
                    <pre className="auditDetails">
                      {
                        typeof
                          item.details ===
                        "string"
                          ? item.details
                          : JSON.stringify(
                              item.details,
                              null,
                              2
                            )
                      }
                    </pre>
                  )}
                </article>
              )
            )}

            {!audit.length &&
              !loading && (
                <div className="empty">
                  Nenhum registro de auditoria.
                </div>
              )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
