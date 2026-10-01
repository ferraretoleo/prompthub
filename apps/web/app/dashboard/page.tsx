"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  useRouter,
  useSearchParams
} from "next/navigation";
import Link from "next/link";
import {
  Eye,
  GitFork,
  Heart,
  Library,
  Lock,
  Plus,
  Globe2
} from "lucide-react";
import AppShell from "@/components/AppShell";
import PromptCard, {
  type PromptItem
} from "@/components/PromptCard";

type Stats = {
  total: number;
  publicCount: number;
  privateCount: number;
  views: number;
  favorites: number;
  forks: number;
};

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();

  const scope = params.get("scope") || "all";

  const [items, setItems] = useState<PromptItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch(`/api/proxy/prompts?scope=${encodeURIComponent(scope)}`, {
        cache: "no-store"
      }),
      fetch("/api/proxy/community/me/stats", {
        cache: "no-store"
      })
    ])
      .then(async ([promptResponse, statsResponse]) => {
        if (promptResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const promptData = await promptResponse.json();
        setItems(promptData?.items || []);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }
      })
      .finally(() => setLoading(false));
  }, [scope, router]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) =>
      [
        item.title,
        item.description,
        item.authorUsername,
        item.authorName
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [items, query]);

  const tabs = [
    ["all", "Todos"],
    ["mine", "Meus Prompts"],
    ["public", "Públicos"],
    ["private", "Privados"],
    ["favorites", "Favoritos"]
  ];

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="pageHeader">
          <div className="pageTitleBlock">
            <h1>Prompts</h1>
            <p>
              Organize seus prompts e explore conteúdos públicos.
            </p>
          </div>

          <div className="pageActions">
            <Link href="/new" className="buttonPrimary">
              <Plus size={16} />
              Novo prompt
            </Link>
          </div>
        </div>

        {scope === "all" && stats && (
          <div className="statsGrid">
            <div className="statCard"><Library size={18}/><strong>{stats.total}</strong><span>Meus prompts</span></div>
            <div className="statCard"><Globe2 size={18}/><strong>{stats.publicCount}</strong><span>Públicos</span></div>
            <div className="statCard"><Lock size={18}/><strong>{stats.privateCount}</strong><span>Privados</span></div>
            <div className="statCard"><Eye size={18}/><strong>{stats.views}</strong><span>Visualizações</span></div>
            <div className="statCard"><Heart size={18}/><strong>{stats.favorites}</strong><span>Favoritos</span></div>
            <div className="statCard"><GitFork size={18}/><strong>{stats.forks}</strong><span>Forks</span></div>
          </div>
        )}

        <div className="toolbar">
          <div className="toolbarSearch">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar esta lista"
            />
          </div>

          <Link href="/explore" className="button">
            Explorar comunidade
          </Link>
        </div>

        <div className="tabs">
          {tabs.map(([key, label]) => (
            <Link
              key={key}
              className={`tab ${scope === key ? "active" : ""}`}
              href={`/dashboard?scope=${key}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="empty">
            Carregando prompts...
          </div>
        ) : filteredItems.length ? (
          <div className="promptList">
            {filteredItems.map((item) => (
              <PromptCard
                key={item.id}
                item={item}
                showEdit={scope === "mine"}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            Nenhum prompt encontrado.
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="empty">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
