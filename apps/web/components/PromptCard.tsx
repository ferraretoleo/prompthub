import Link from "next/link";
import {
  Copy,
  Eye,
  GitFork,
  Heart,
  Lock,
  Globe2,
  History
} from "lucide-react";

export type PromptItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  visibility: "PRIVATE" | "PUBLIC";
  currentVersion: number;
  updatedAt: string;
  userId: string;
  favoritesCount: number;
  forksCount: number;
  viewsCount: number;
  authorName: string;
  authorUsername: string;
  avatarUrl?: string | null;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}

export default function PromptCard({
  item
}: {
  item: PromptItem;
}) {
  const href =
    `/${item.authorUsername}/${item.slug}`;

  return (
    <article className="card">
      <div className="cardhead">
        <div className="avatar">
          {item.authorName
            ?.slice(0, 1)
            .toUpperCase() || "P"}
        </div>

        <div className="promptMain">
          <div className="promptTopline">
            <Link
              href={href}
              className="promptTitle"
            >
              {item.title}
            </Link>

            <span
              className={`badge ${
                item.visibility ===
                "PUBLIC"
                  ? "public"
                  : "private"
              }`}
            >
              {item.visibility ===
              "PUBLIC" ? (
                <>
                  <Globe2 size={12} />
                  Público
                </>
              ) : (
                <>
                  <Lock size={12} />
                  Privado
                </>
              )}
            </span>
          </div>

          <div className="meta">
            @{item.authorUsername}
            {" · "}
            versão {item.currentVersion}
          </div>

          <p className="promptDescription">
            {item.description}
          </p>

          <div className="tags">
            <span className="tag">
              Prompt
            </span>

            <span className="tag">
              v{item.currentVersion}
            </span>
          </div>

          <div className="promptMetaRow">
            <span className="action">
              <Eye size={14} />
              {item.viewsCount}
            </span>

            <span className="action">
              <Heart size={14} />
              {item.favoritesCount}
            </span>

            <span className="action">
              <GitFork size={14} />
              {item.forksCount}
            </span>

            <span className="action">
              <History size={14} />
              Atualizado em{" "}
              {formatDate(
                item.updatedAt
              )}
            </span>
          </div>

          <div className="actions">
            <button
              type="button"
              className="actionButton"
            >
              <Copy size={14} />
              Copiar
            </button>

            <Link
              href={href}
              className="actionButton"
            >
              Abrir prompt
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
