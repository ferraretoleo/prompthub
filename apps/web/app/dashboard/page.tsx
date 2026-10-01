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
import { Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import PromptCard, {
  type PromptItem
} from "@/components/PromptCard";

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();

  const scope = params.get("scope") || "all";

  const [items, setItems] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);

    fetch(
      `/api/proxy/prompts?scope=${encodeURIComponent(scope)}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return { items: [] };
        }

        return response.json();
      })
      .then((data) => {
        setItems(data?.items || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [scope, router]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter((item) =>
      [
        item.title,
        item.description,
        item.authorUsername,
        item.authorName
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(term)
        )
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
            <Link
              href="/new"
              className="buttonPrimary"
            >
              <Plus size={16} />
              Novo prompt
            </Link>
          </div>
        </div>

        <div className="toolbar">
          <div className="toolbarSearch">
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Filtrar prompts por nome, descrição ou autor"
            />
          </div>
        </div>

        <div className="tabs">
          {tabs.map(([key, label]) => (
            <Link
              key={key}
              className={`tab ${
                scope === key ? "active" : ""
              }`}
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
    <Suspense
      fallback={
        <div className="empty">
          Carregando...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
