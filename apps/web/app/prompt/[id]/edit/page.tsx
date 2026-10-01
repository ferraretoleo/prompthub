"use client";

import {
  FormEvent,
  useEffect,
  useState,
  use
} from "react";
import {
  useRouter
} from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save
} from "lucide-react";
import AppShell from "@/components/AppShell";

type Category = {
  id: string;
  name: string;
};

type PromptData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  visibility: "PRIVATE" | "PUBLIC";
  categoryId?: string | null;
  isOwner: boolean;
};

export default function EditPromptPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [prompt, setPrompt] =
    useState<PromptData | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        const [
          promptResponse,
          categoryResponse
        ] = await Promise.all([
          fetch(
            `/api/proxy/prompts/${id}`,
            { cache: "no-store" }
          ),
          fetch(
            "/api/proxy/categories",
            { cache: "no-store" }
          )
        ]);

        if (promptResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const promptData =
          await promptResponse.json();

        if (!promptResponse.ok) {
          setError(
            promptData.error ||
              "Prompt não encontrado"
          );
          return;
        }

        if (!promptData.prompt.isOwner) {
          router.replace(
            `/prompt/${id}`
          );
          return;
        }

        setPrompt(promptData.prompt);

        if (categoryResponse.ok) {
          const categoryData =
            await categoryResponse.json();

          setCategories(
            categoryData.items || []
          );
        }
      } catch {
        setError(
          "Não foi possível carregar o prompt."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");

    const form =
      new FormData(event.currentTarget);

    const body = {
      title: form.get("title"),
      slug: form.get("slug"),
      description:
        form.get("description"),
      content: form.get("content"),
      categoryId:
        form.get("categoryId") ||
        null,
      visibility:
        form.get("visibility"),
      changeDescription:
        form.get(
          "changeDescription"
        ) || undefined
    };

    try {
      const response = await fetch(
        `/api/proxy/prompts/${id}`,
        {
          method: "PATCH",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Não foi possível salvar"
        );
        return;
      }

      router.replace(
        `/prompt/${id}`
      );
    } catch {
      setError(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setBusy(false);
    }
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

  if (!prompt) {
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
        <div className="pageHeader">
          <div className="pageTitleBlock">
            <h1>Editar prompt</h1>
            <p>
              As alterações no conteúdo
              geram uma nova versão.
            </p>
          </div>

          <Link
            href={`/prompt/${id}`}
            className="button"
          >
            <ArrowLeft size={15} />
            Voltar
          </Link>
        </div>

        <form
          className="panel editPromptPanel"
          onSubmit={submit}
        >
          <div className="panelBody">
            <div className="field">
              <label>Título</label>
              <input
                name="title"
                required
                minLength={3}
                defaultValue={
                  prompt.title
                }
              />
            </div>

            <div className="field">
              <label>Slug</label>
              <input
                name="slug"
                required
                defaultValue={
                  prompt.slug
                }
              />
            </div>

            <div className="field">
              <label>
                Descrição
              </label>
              <input
                name="description"
                required
                maxLength={500}
                defaultValue={
                  prompt.description
                }
              />
            </div>

            <div className="field">
              <label>Prompt</label>
              <textarea
                name="content"
                required
                defaultValue={
                  prompt.content
                }
              />
            </div>

            <div className="editPromptOptions">
              <div className="field">
                <label>
                  Categoria
                </label>

                <select
                  name="categoryId"
                  defaultValue={
                    prompt.categoryId ||
                    ""
                  }
                >
                  <option value="">
                    Sem categoria
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="field">
                <label>
                  Visibilidade
                </label>

                <select
                  name="visibility"
                  defaultValue={
                    prompt.visibility
                  }
                >
                  <option value="PRIVATE">
                    Privado
                  </option>

                  <option value="PUBLIC">
                    Público
                  </option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>
                Descrição da alteração
              </label>

              <input
                name="changeDescription"
                maxLength={500}
                placeholder="Ex.: Ajuste para melhorar análise de queries"
              />
            </div>

            {error && (
              <p className="error">
                {error}
              </p>
            )}
          </div>

          <div className="editPromptFooter">
            <Link
              href={`/prompt/${id}`}
              className="button"
            >
              Cancelar
            </Link>

            <button
              className="buttonPrimary"
              disabled={busy}
            >
              <Save size={15} />
              {busy
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
