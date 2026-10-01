"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";
import {
  Eye,
  GitFork,
  Heart,
  Library,
  Lock,
  Globe2,
  Save
} from "lucide-react";
import AppShell from "@/components/AppShell";

type UserData = {
  name: string;
  username: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

type Stats = {
  total: number;
  publicCount: number;
  privateCount: number;
  views: number;
  favorites: number;
  forks: number;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const [meResponse, statsResponse] = await Promise.all([
      fetch("/api/proxy/auth/me", { cache: "no-store" }),
      fetch("/api/proxy/community/me/stats", { cache: "no-store" })
    ]);

    if (meResponse.ok) {
      const data = await meResponse.json();
      setUser(data.user);
    }

    if (statsResponse.ok) {
      const data = await statsResponse.json();
      setStats(data.stats);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/proxy/community/me/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        bio: form.get("bio") || null,
        avatarUrl: form.get("avatarUrl") || null
      })
    });

    const data = await response.json();

    if (response.ok) {
      setUser((current) => current ? { ...current, ...data.user } : data.user);
      setMessage("Perfil atualizado.");
    } else {
      setMessage(data.error || "Não foi possível atualizar o perfil.");
    }

    setBusy(false);
  }

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="pageHeader">
          <div className="pageTitleBlock">
            <h1>Seu perfil</h1>
            <p>
              Informações públicas exibidas junto aos seus prompts.
            </p>
          </div>
        </div>

        {stats && (
          <div className="statsGrid">
            <div className="statCard"><Library size={18}/><strong>{stats.total}</strong><span>Prompts</span></div>
            <div className="statCard"><Globe2 size={18}/><strong>{stats.publicCount}</strong><span>Públicos</span></div>
            <div className="statCard"><Lock size={18}/><strong>{stats.privateCount}</strong><span>Privados</span></div>
            <div className="statCard"><Eye size={18}/><strong>{stats.views}</strong><span>Visualizações</span></div>
            <div className="statCard"><Heart size={18}/><strong>{stats.favorites}</strong><span>Favoritos</span></div>
            <div className="statCard"><GitFork size={18}/><strong>{stats.forks}</strong><span>Forks</span></div>
          </div>
        )}

        {user && (
          <div className="profileLayout">
            <aside className="profileSummary panel">
              <div className="profileAvatarLarge">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  user.name.slice(0, 1).toUpperCase()
                )}
              </div>

              <h2>{user.name}</h2>
              <div className="meta">@{user.username}</div>
              <p>{user.bio || "Sem biografia."}</p>

              <a className="button" href={`/u/${user.username}`}>
                Ver perfil público
              </a>
            </aside>

            <form className="panel" onSubmit={save}>
              <div className="panelHeader">
                <h3>Editar perfil</h3>
              </div>

              <div className="panelBody">
                <div className="field">
                  <label>Nome</label>
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={120}
                    defaultValue={user.name}
                  />
                </div>

                <div className="field">
                  <label>Username</label>
                  <input value={user.username} disabled />
                  <span className="meta">
                    O username permanece fixo nesta fase para preservar seus links públicos.
                  </span>
                </div>

                <div className="field">
                  <label>E-mail</label>
                  <input value={user.email} disabled />
                </div>

                <div className="field">
                  <label>Biografia</label>
                  <textarea
                    name="bio"
                    maxLength={500}
                    defaultValue={user.bio || ""}
                    style={{ minHeight: 120, fontFamily: "inherit" }}
                    placeholder="Conte um pouco sobre você e os tipos de prompts que publica."
                  />
                </div>

                <div className="field">
                  <label>URL do avatar</label>
                  <input
                    name="avatarUrl"
                    type="url"
                    defaultValue={user.avatarUrl || ""}
                    placeholder="https://..."
                  />
                </div>

                {message && <p className="meta">{message}</p>}
              </div>

              <div className="editPromptFooter">
                <button className="buttonPrimary" disabled={busy}>
                  <Save size={15} />
                  {busy ? "Salvando..." : "Salvar perfil"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
