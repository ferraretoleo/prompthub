import type {
  Metadata
} from "next";
import {
  notFound
} from "next/navigation";
import PublicPrompt from "@/components/PublicPrompt";
import { backendUrl } from "@/lib/backend";

type Props = {
  params: Promise<{
    username: string;
    slug: string;
  }>;
};

async function getPrompt(
  username: string,
  slug: string
) {
  const response =
    await fetch(
      backendUrl(
        `/api/prompts/public/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`
      ),
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {
    return null;
  }

  const data =
    await response.json();

  return data.prompt;
}

export async function generateMetadata({
  params
}: Props): Promise<Metadata> {
  const {
    username,
    slug
  } = await params;

  const prompt =
    await getPrompt(
      username,
      slug
    );

  if (!prompt) {
    return {
      title:
        "Prompt não encontrado"
    };
  }

  return {
    title: prompt.title,
    description:
      prompt.description,
    openGraph: {
      title:
        `${prompt.title} | PromptHub`,
      description:
        prompt.description,
      type: "article"
    },
    twitter: {
      card: "summary",
      title:
        `${prompt.title} | PromptHub`,
      description:
        prompt.description
    }
  };
}

export default async function PublicPromptPage({
  params
}: Props) {
  const {
    username,
    slug
  } = await params;

  const prompt =
    await getPrompt(
      username,
      slug
    );

  if (!prompt) {
    notFound();
  }

  return (
    <PublicPrompt
      prompt={prompt}
    />
  );
}
