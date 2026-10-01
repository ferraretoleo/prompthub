"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
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

export default function NewPromptPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/proxy/categories", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setCategories(data.items || []))
      .catch(() => {});
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);

    const tags = String(form.get("tags") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 8);

    const body = {
      title: form.get("title"),
      slug: form.get("slug") || undefined,
      description: form.get("description"),
      content: form.get("content"),
      categoryId: form.get("categoryId") || null,
      visibility: form.get("visibility"),
      tags
    };

    try {
      const response = await fetch("/api/proxy/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError(data.error || "Não foi possível criar o prompt");
        return;
      }

      router.replace(`/prompt/${data.prompt.id}`);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="pageHeader">
          <div className="pageTitleBlock">
            <h1>Novo prompt</h1>
            <p>Crie um novo prompt no seu repositório.</p>
          </div>

          <Link href="/dashboard" className="button">
            <ArrowLeft size={15} />
            Voltar
          </Link>
        </div>

        <form className="panel editPromptPanel" onSubmit={submit}>
          <div className="panelBody">
            <div className="field">
              <label>Título</label>
              <input
                name="title"
                required
                minLength={3}
                placeholder="SQL Server Performance Analyzer"
              />
            </div>

            <div className="field">
              <label>Slug opcional</label>
              <input
                name="slug"
                placeholder="sql-server-performance-analyzer"
              />
            </div>

            <div className="field">
              <label>Descrição</label>
              <input
                name="description"
                required
                maxLength={500}
                placeholder="Explique em poucas palavras o objetivo do prompt"
              />
            </div>

            <div className="field">
              <label>Prompt</label>
              <textarea
                name="content"
                required
                placeholder="Escreva seu prompt aqui. Variáveis podem seguir o padrão {{nome_variavel}}."
              />
            </div>

            <div className="field">
              <label>Tags</label>
              <input
                name="tags"
                placeholder="sql server, dba, performance, tuning"
              />
              <span className="meta">
                Separe por vírgula. Máximo de 8 tags.
              </span>
            </div>

            <div className="editPromptOptions">
              <div className="field">
                <label>Categoria</label>
                <select name="categoryId">
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Visibilidade</label>
                <select name="visibility" defaultValue="PRIVATE">
                  <option value="PRIVATE">Privado</option>
                  <option value="PUBLIC">Público</option>
                </select>
              </div>
            </div>

            {error && <p className="error">{error}</p>}
          </div>

          <div className="editPromptFooter">
            <Link href="/dashboard" className="button">
              Cancelar
            </Link>

            <button className="buttonPrimary" disabled={busy}>
              <Save size={15} />
              {busy ? "Salvando..." : "Salvar prompt"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
