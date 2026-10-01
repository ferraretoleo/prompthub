"use client";

import {
  use,
  useEffect,
  useState
} from "react";
import AppShell from "@/components/AppShell";
import PromptCard, {
  type PromptItem
} from "@/components/PromptCard";
import {
  Eye,
  GitFork,
  Heart,
  Library
} from "lucide-react";

type PublicUser = {
  name: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

type PublicStats = {
  prompts: number;
  views: number;
  favorites: number;
  forks: number;
};

export default function PublicProfilePage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [items, setItems] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proxy/community/profile/${encodeURIComponent(username)}`, {
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return response.json();
      })
      .then((data) => {
        if (!data) return;
        setUser(data.user);
        setStats(data.stats);
        setItems(data.items || []);
      })
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <AppShell>
      <div className="contentWrap">
        {loading ? (
          <div className="empty">Carregando perfil...</div>
        ) : !user ? (
          <div className="empty">Perfil não encontrado.</div>
        ) : (
          <>
            <div className="publicProfileHeader">
              <div className="profileAvatarLarge">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  user.name.slice(0, 1).toUpperCase()
                )}
              </div>

              <div>
                <h1>{user.name}</h1>
                <div className="meta">@{user.username}</div>
                <p>{user.bio || "Sem biografia pública."}</p>
              </div>
            </div>

            {stats && (
              <div className="statsGrid statsGridFour">
                <div className="statCard"><Library size={18}/><strong>{stats.prompts}</strong><span>Prompts públicos</span></div>
                <div className="statCard"><Eye size={18}/><strong>{stats.views}</strong><span>Visualizações</span></div>
                <div className="statCard"><Heart size={18}/><strong>{stats.favorites}</strong><span>Favoritos</span></div>
                <div className="statCard"><GitFork size={18}/><strong>{stats.forks}</strong><span>Forks</span></div>
              </div>
            )}

            <div className="pageHeader" style={{ marginTop: 28 }}>
              <div className="pageTitleBlock">
                <h1>Prompts públicos</h1>
              </div>
            </div>

            {items.length ? (
              <div className="promptList">
                {items.map((item) => (
                  <PromptCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="empty">
                Este usuário ainda não publicou prompts.
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
