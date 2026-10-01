"use client";

import {
  Check,
  Copy,
  Eye,
  GitFork,
  Heart,
  Globe2
} from "lucide-react";
import {
  useState
} from "react";
import AppShell from "@/components/AppShell";

export default function PublicPrompt({
  prompt
}: {
  prompt: any;
}) {
  const [copied, setCopied] =
    useState(false);

  async function copy() {
    await navigator.clipboard.writeText(
      prompt.content
    );

    setCopied(true);

    setTimeout(
      () => setCopied(false),
      1500
    );
  }

  return (
    <AppShell>
      <div className="contentWrap">
        <div className="repoBreadcrumb">
          <a href="/dashboard">
            PromptHub
          </a>

          <span>/</span>

          <span>
            {prompt.authorUsername}
          </span>

          <span>/</span>

          <strong>
            {prompt.slug}
          </strong>
        </div>

        <div className="pageHeader">
          <div className="pageTitleBlock">
            <div className="promptDetailTitleLine">
              <h1>
                {prompt.title}
              </h1>

              <span className="badge public">
                <Globe2 size={12} />
                Público
              </span>
            </div>

            <p>
              {prompt.description}
            </p>
          </div>
        </div>

        <div className="promptStatsBar">
          <span>
            @{prompt.authorUsername}
          </span>

          <span>
            <Eye size={14} />
            {prompt.viewsCount} visualizações
          </span>

          <span>
            <Heart size={14} />
            {prompt.favoritesCount} favoritos
          </span>

          <span>
            <GitFork size={14} />
            {prompt.forksCount} forks
          </span>

          {prompt.categoryName && (
            <span>
              Categoria: {prompt.categoryName}
            </span>
          )}
        </div>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <strong>
                Prompt
              </strong>

              <span className="meta promptVersionLabel">
                versão {prompt.currentVersion}
              </span>
            </div>

            <button
              type="button"
              className="button"
              onClick={copy}
            >
              {copied ? (
                <>
                  <Check size={15} />
                  Copiado
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copiar prompt
                </>
              )}
            </button>
          </div>

          <div className="promptCodeWrap">
            <pre className="promptCode">
              {prompt.content}
            </pre>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
