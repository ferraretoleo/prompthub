"use client";

import {
  Suspense,
  useEffect,
  useState
} from "react";
import {
  useRouter,
  useSearchParams
} from "next/navigation";
import AppShell from "@/components/AppShell";
import PromptCard, {
  type PromptItem
} from "@/components/PromptCard";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type PopularTag = {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
};

function ExploreContent() {
  const params = useSearchParams();
  const router = useRouter();

  const initialQ = params.get("q") || "";
  const sort = params.get("sort") || "recent";
  const category = params.get("category") || "";
  const tag = params.get("tag") || "";

  const [q, setQ] = useState(initialQ);
  const [items, setItems] = useState<PromptItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<PopularTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams();

    if (initialQ) query.set("q", initialQ);
    if (sort) query.set("sort", sort);
    if (category) query.set("category", category);
    if (tag) query.set("tag", tag);

    setLoading(true);

    Promise.all([
      fetch(`/api/proxy/community/explore?${query.toString()}`, {
        cache: "no-store"
      }),
      fetch("/api/proxy/categories", { cache: "no-store" }),
      fetch("/api/proxy/community/tags", { cache: "no-store" })
    ])
      .then(async ([promptsResponse, categoriesResponse, tagsResponse]) => {
        if (promptsResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const [promptData, categoryData, tagData] = await Promise.all([
          promptsResponse.json(),
          categoriesResponse.json(),
          tagsResponse.json()
        ]);

        setItems(promptData.items || []);
        setCategories(categoryData.items || []);
        setTags(tagData.items || []);
      })
      .finally(() => setLoading(false));
  }, [initialQ, sort, category, tag, router]);

  function navigate(next: {
    q?: string;
    sort?: string;
    category?: string;
    tag?: string;
  }) {
    const query = new URLSearchParams();

    const values = {
      q: next.q ?? initialQ,
      sort: next.sort ?? sort,
      category: next.category ?? category,
      tag: next.tag ?? tag
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value && !(key === "sort" && value === "recent")) {
        query.set(key, value);
      }
    });

    router.push(`/explore${query.toString() ? `?${query.toString()}` : ""}`);
  }

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="pageHeader">
          <div className="pageTitleBlock">
            <h1>Explorar</h1>
            <p>
              Descubra prompts publicados pela comunidade.
            </p>
          </div>
        </div>

        <form
          className="communitySearch"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ q });
          }}
        >
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por prompt, descrição ou autor"
          />

          <button className="buttonPrimary">
            Buscar
          </button>
        </form>

        <div className="exploreLayout">
          <aside className="exploreSidebar">
            <section className="panel">
              <div className="panelHeader">
                <h3>Ordenar</h3>
              </div>

              <div className="filterList">
                {[
                  ["recent", "Mais recentes"],
                  ["views", "Mais vistos"],
                  ["favorites", "Mais favoritados"],
                  ["forks", "Mais forkados"]
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`filterButton ${sort === key ? "active" : ""}`}
                    onClick={() => navigate({ sort: key })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <h3>Categorias</h3>
              </div>

              <div className="filterList">
                <button
                  type="button"
                  className={`filterButton ${!category ? "active" : ""}`}
                  onClick={() => navigate({ category: "" })}
                >
                  Todas
                </button>

                {categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`filterButton ${category === item.slug ? "active" : ""}`}
                    onClick={() => navigate({ category: item.slug })}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <h3>Tags populares</h3>
              </div>

              <div className="tagCloud">
                {tags.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`tag ${tag.toLowerCase() === item.name.toLowerCase() ? "selectedTag" : ""}`}
                    onClick={() =>
                      navigate({
                        tag:
                          tag.toLowerCase() === item.name.toLowerCase()
                            ? ""
                            : item.name
                      })
                    }
                  >
                    #{item.name}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section>
            {loading ? (
              <div className="empty">
                Carregando prompts...
              </div>
            ) : items.length ? (
              <div className="promptList">
                {items.map((item) => (
                  <PromptCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <div className="empty">
                Nenhum prompt público encontrado com estes filtros.
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="empty">Carregando...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
