"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import PromptCard, { type PromptItem } from "@/components/PromptCard";

function DashboardContent(){
  const params=useSearchParams(); const router=useRouter(); const scope=params.get("scope")||"all";
  const [items,setItems]=useState<PromptItem[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{setLoading(true);fetch(`/api/proxy/prompts?scope=${encodeURIComponent(scope)}`,{cache:"no-store"}).then(async r=>{
    if(r.status===401){router.replace("/login");return {items:[]};} return r.json();}).then(d=>{setItems(d?.items||[]);setLoading(false);}).catch(()=>setLoading(false));},[scope,router]);
  const tabs=[["all","Todos"],["mine","Meus Prompts"],["public","Públicos"],["private","Privados"]];
  return <AppShell><header className="topbar"><div className="topline">PromptHub</div><div className="tabs">{tabs.map(([key,label])=><a key={key} className={`tab ${scope===key?"active":""}`} href={`/dashboard?scope=${key}`}>{label}</a>)}</div></header>
    {loading?<div className="empty">Carregando prompts...</div>:items.length?items.map(i=><PromptCard key={i.id} item={i}/>):<div className="empty">Nenhum prompt encontrado neste filtro.</div>}
  </AppShell>;
}

export default function DashboardPage(){ return <Suspense fallback={<div className="empty">Carregando...</div>}><DashboardContent/></Suspense>; }
