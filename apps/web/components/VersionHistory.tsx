"use client";

import { History } from "lucide-react";

export type PromptVersion = {
  id: string;
  version: number;
  content: string;
  changeDescription?: string | null;
  createdAt: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function VersionHistory({
  items,
  onSelect
}: {
  items: PromptVersion[];
  onSelect?: (item: PromptVersion) => void;
}) {
  if (!items.length) {
    return (
      <div className="empty">
        Nenhuma versão registrada.
      </div>
    );
  }

  return (
    <div className="versionList">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="versionRow"
          onClick={() => onSelect?.(item)}
        >
          <div className="versionIcon">
            <History size={16} />
          </div>

          <div>
            <strong>
              Versão {item.version}
            </strong>

            <div className="meta">
              {item.changeDescription || "Atualização"}
            </div>

            <div className="meta">
              {formatDate(item.createdAt)}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
