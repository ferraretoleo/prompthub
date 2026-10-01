"use client";
import { useState } from "react";
import { Copy, Check, GitFork, Heart } from "lucide-react";

export default function PublicPrompt({ prompt }: { prompt: any }) {
  const [copied,setCopied]=useState(false);
  async function copy(){ await navigator.clipboard.writeText(prompt.content); setCopied(true); setTimeout(()=>setCopied(false),1500); }
  return <main style={{maxWidth:820,margin:"0 auto",padding:"34px 20px 80px"}}>
    <a href="/dashboard" className="brand"><img src="/icons/icon-192.png" alt=""/><span>PromptHub</span></a>
    <article className="formcard">
      <div className="meta">@{prompt.authorUsername} · v{prompt.currentVersion}</div>
      <h1 style={{fontSize:30,marginBottom:8}}>{prompt.title}</h1>
      <p style={{color:"#bac5d6"}}>{prompt.description}</p>
      <div className="actions" style={{margin:"18px 0"}}><span className="action"><Heart size={16}/>{prompt.favoritesCount}</span><span className="action"><GitFork size={16}/>{prompt.forksCount}</span></div>
      <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",background:"#080d16",border:"1px solid #263246",padding:18,borderRadius:14,lineHeight:1.6}}>{prompt.content}</pre>
      <button className="primary" onClick={copy}>{copied?<><Check size={17}/> Prompt copiado</>:<><Copy size={17}/> Copiar Prompt</>}</button>
    </article>
  </main>
}
