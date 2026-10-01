import { notFound } from "next/navigation";
import PublicPrompt from "@/components/PublicPrompt";
import { backendUrl } from "@/lib/backend";

type Props={params:Promise<{username:string;slug:string}>};
export default async function PublicPromptPage({params}:Props){
  const {username,slug}=await params;
  const r=await fetch(backendUrl(`/api/prompts/public/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`),{cache:"no-store"});
  if(r.status===404) notFound();
  if(!r.ok) throw new Error("Falha ao carregar prompt público");
  const data=await r.json();
  return <PublicPrompt prompt={data.prompt}/>;
}
