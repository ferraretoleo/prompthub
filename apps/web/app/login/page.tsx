"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/login", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({email:f.get("email"),password:f.get("password")}) });
    const data = await r.json(); setBusy(false);
    if(!r.ok) return setError(data.error || "Falha no login");
    router.replace("/dashboard");
  }
  return <main className="authpage"><form className="authbox" onSubmit={submit}>
    <div className="brand"><img src="/icons/icon-192.png" alt=""/><span>PromptHub</span></div>
    <h1 style={{fontSize:24}}>Entrar</h1><p className="meta">Acesse seus prompts e descubra conteúdos públicos.</p>
    <div className="field"><label>E-mail</label><input name="email" type="email" required autoComplete="email"/></div>
    <div className="field"><label>Senha</label><input name="password" type="password" required autoComplete="current-password"/></div>
    {error && <p className="error">{error}</p>}<button className="primary" disabled={busy}>{busy?"Entrando...":"Entrar"}</button>
    <p className="meta" style={{textAlign:"center",marginTop:18}}>Ainda não tem conta? <Link href="/register" style={{color:"#8eb0ff"}}>Criar conta</Link></p>
  </form></main>;
}
