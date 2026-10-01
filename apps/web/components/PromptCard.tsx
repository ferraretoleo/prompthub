import Link from "next/link";
import {
  Copy,
  Eye,
  GitFork,
  Heart,
  Lock,
  Globe2,
  History,
  Pencil
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
  categoryName?: string | null;
  tags?: string[];
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function PromptCard({
  item,
  showEdit = false
}: {
  item: PromptItem;
  showEdit?: boolean;
}) {
  return (
    <article className="card">
      <div className="cardhead">
        <Link href={`/u/${item.authorUsername}`} className="avatar">
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt={item.authorName}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
          ) : (
            item.authorName?.slice(0, 1).toUpperCase() || "P"
          )}
        </Link>

        <div className="promptMain">
          <div className="promptTopline">
            <Link
              href={`/prompt/${item.id}`}
              className="promptTitle"
            >
              {item.title}
            </Link>

            <span
              className={`badge ${
                item.visibility === "PUBLIC" ? "public" : "private"
              }`}
            >
              {item.visibility === "PUBLIC" ? (
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
            <Link href={`/u/${item.authorUsername}`}>
              @{item.authorUsername}
            </Link>
            {" · "}versão {item.currentVersion}
            {item.categoryName ? ` · ${item.categoryName}` : ""}
          </div>

          <p className="promptDescription">
            {item.description}
          </p>

          <div className="tags">
            {(item.tags?.length ? item.tags : ["Prompt"]).map((tag) => (
              <Link
                key={tag}
                className="tag"
                href={`/explore?tag=${encodeURIComponent(tag)}`}
              >
                #{tag}
              </Link>
            ))}
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
              Atualizado em {formatDate(item.updatedAt)}
            </span>
          </div>

          <div className="actions">
            <Link href={`/prompt/${item.id}`} className="actionButton">
              <Copy size={14} />
              Abrir prompt
            </Link>

            {showEdit && (
              <Link
                href={`/prompt/${item.id}/edit`}
                className="actionButton"
              >
                <Pencil size={14} />
                Editar
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
