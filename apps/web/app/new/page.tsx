"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type Category={id:string;name:string};
export default function NewPromptPage(){const router=useRouter();const [categories,setCategories]=useState<Category[]>([]);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  useEffect(()=>{fetch("/api/proxy/categories").then(r=>r.json()).then(d=>setCategories(d.items||[]));},[]);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const f=new FormData(e.currentTarget);const body={title:f.get("title"),slug:f.get("slug")||undefined,description:f.get("description"),content:f.get("content"),categoryId:f.get("categoryId")||null,visibility:f.get("visibility")};
    const r=await fetch("/api/proxy/prompts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const d=await r.json();setBusy(false);if(r.status===401)return router.replace("/login");if(!r.ok)return setError(d.error||"Não foi possível criar o prompt");router.replace("/dashboard?scope=mine");}
  return <AppShell><header className="topbar"><div className="topline">Novo Prompt</div></header><div className="formwrap"><form className="formcard" onSubmit={submit}>
    <div className="field"><label>Título</label><input name="title" required minLength={3} placeholder="SQL Server Performance Analyzer"/></div>
    <div className="field"><label>Slug opcional</label><input name="slug" placeholder="sql-server-performance-analyzer"/></div>
    <div className="field"><label>Descrição</label><input name="description" required maxLength={500} placeholder="Explique em poucas palavras o objetivo do prompt"/></div>
    <div className="field"><label>Prompt</label><textarea name="content" required placeholder="Escreva seu prompt aqui. Variáveis podem seguir o padrão {{nome_variavel}}."/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div className="field"><label>Categoria</label><select name="categoryId"><option value="">Sem categoria</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="field"><label>Visibilidade</label><select name="visibility" defaultValue="PRIVATE"><option value="PRIVATE">Privado</option><option value="PUBLIC">Público</option></select></div></div>
    {error&&<p className="error">{error}</p>}<button className="primary" disabled={busy}>{busy?"Salvando...":"Salvar Prompt"}</button>
  </form></div></AppShell>}
