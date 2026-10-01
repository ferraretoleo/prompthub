"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router=useRouter(); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const f=new FormData(e.currentTarget);
    const r=await fetch("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:f.get("name"),username:f.get("username"),email:f.get("email"),password:f.get("password")})});
    const data=await r.json();setBusy(false);if(!r.ok)return setError(data.error||"Falha no cadastro");router.replace("/dashboard");}
  return <main className="authpage"><form className="authbox" onSubmit={submit}>
    <div className="brand"><img src="/icons/icon-192.png" alt=""/><span>PromptHub</span></div><h1 style={{fontSize:24}}>Criar conta</h1>
    <div className="field"><label>Nome</label><input name="name" required minLength={2}/></div>
    <div className="field"><label>Username</label><input name="username" required minLength={3} placeholder="leonardo"/></div>
    <div className="field"><label>E-mail</label><input name="email" type="email" required/></div>
    <div className="field"><label>Senha</label><input name="password" type="password" required minLength={8}/></div>
    {error&&<p className="error">{error}</p>}<button className="primary" disabled={busy}>{busy?"Criando...":"Criar conta"}</button>
    <p className="meta" style={{textAlign:"center",marginTop:18}}>Já tem conta? <Link href="/login" style={{color:"#8eb0ff"}}>Entrar</Link></p>
  </form></main>;
}
