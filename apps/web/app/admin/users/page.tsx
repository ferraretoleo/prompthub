"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type UserItem = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "MASTER" | "USER";
  isActive: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [items, setItems] =
    useState<UserItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadUsers = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/proxy/admin/users",
          { cache: "no-store" }
        );

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          router.replace("/dashboard");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ||
            "Falha ao carregar usuários"
          );
          return;
        }

        setItems(data.items || []);
      } catch {
        setError(
          "Não foi possível carregar os usuários"
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function createUser(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setSuccess("");

    const form = new FormData(
      event.currentTarget
    );

    try {
      const response = await fetch(
        "/api/proxy/admin/users",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            name: form.get("name"),
            username:
              form.get("username"),
            email: form.get("email"),
            password:
              form.get("password")
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
          "Falha ao criar usuário"
        );
        return;
      }

      event.currentTarget.reset();

      setSuccess(
        "Usuário criado com sucesso."
      );

      await loadUsers();
    } catch {
      setError(
        "Não foi possível criar o usuário"
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(
    user: UserItem
  ) {
    setError("");
    setSuccess("");

    const response = await fetch(
      `/api/proxy/admin/users/${user.id}/status`,
      {
        method: "PATCH",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          isActive: !user.isActive
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(
        data.error ||
        "Falha ao alterar status"
      );
      return;
    }

    setSuccess(
      user.isActive
        ? "Usuário desativado."
        : "Usuário ativado."
    );

    await loadUsers();
  }

  async function resetPassword(
    user: UserItem
  ) {
    const password = window.prompt(
      `Nova senha para ${user.name}:`
    );

    if (!password) {
      return;
    }

    setError("");
    setSuccess("");

    const response = await fetch(
      `/api/proxy/admin/users/${user.id}/password`,
      {
        method: "PATCH",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(
        data.error ||
        "Falha ao redefinir senha"
      );
      return;
    }

    setSuccess(
      `Senha de ${user.name} redefinida.`
    );
  }

  return (
    <AppShell>
      <header className="topbar">
        <div className="topline">
          Administração de usuários
        </div>
      </header>

      <section
        style={{
          padding: 20,
          borderBottom:
            "1px solid rgba(255,255,255,.08)"
        }}
      >
        <h2
          style={{
            fontSize: 20,
            marginBottom: 14
          }}
        >
          Novo usuário
        </h2>

        <form
          onSubmit={createUser}
          style={{
            display: "grid",
            gap: 12
          }}
        >
          <div className="field">
            <label>Nome</label>
            <input
              name="name"
              required
              minLength={2}
            />
          </div>

          <div className="field">
            <label>Username</label>
            <input
              name="username"
              required
              minLength={3}
            />
          </div>

          <div className="field">
            <label>E-mail</label>
            <input
              name="email"
              type="email"
              required
            />
          </div>

          <div className="field">
            <label>
              Senha inicial
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
            />
          </div>

          <button
            className="primary"
            disabled={busy}
            style={{
              width: "fit-content"
            }}
          >
            {busy
              ? "Criando..."
              : "Criar usuário"}
          </button>
        </form>

        {error && (
          <p
            className="error"
            style={{ marginTop: 12 }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="meta"
            style={{
              marginTop: 12,
              color: "#73d99a"
            }}
          >
            {success}
          </p>
        )}
      </section>

      <section style={{ padding: 20 }}>
        <h2
          style={{
            fontSize: 20,
            marginBottom: 14
          }}
        >
          Usuários cadastrados
        </h2>

        {loading ? (
          <p className="meta">
            Carregando...
          </p>
        ) : items.length === 0 ? (
          <p className="meta">
            Nenhum usuário cadastrado.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 12
            }}
          >
            {items.map((user) => (
              <div
                key={user.id}
                className="sidebox"
                style={{
                  margin: 0
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 16,
                    alignItems:
                      "flex-start",
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <strong>
                      {user.name}
                    </strong>

                    <p className="meta">
                      @{user.username}
                    </p>

                    <p className="meta">
                      {user.email}
                    </p>

                    <p className="meta">
                      Perfil: {user.role}
                      {" · "}
                      Status:{" "}
                      {user.isActive
                        ? "Ativo"
                        : "Inativo"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap"
                    }}
                  >
                    {user.role !==
                      "MASTER" && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleStatus(user)
                        }
                      >
                        {user.isActive
                          ? "Desativar"
                          : "Ativar"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        resetPassword(user)
                      }
                    >
                      Redefinir senha
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
