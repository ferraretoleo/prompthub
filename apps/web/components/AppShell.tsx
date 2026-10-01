"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Library, Star, Plus, User, Settings, LogOut, Bell } from "lucide-react";

const nav = [
  ["/dashboard", "Início", Home],
  ["/dashboard?scope=public", "Explorar", Search],
  ["/dashboard?scope=mine", "Meus Prompts", Library],
  ["/dashboard?scope=favorites", "Favoritos", Star],
  ["/profile", "Perfil", User],
  ["/settings", "Configurações", Settings]
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }
  return <div className="shell">
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><img src="/icons/icon-192.png" alt="" /><span>PromptHub</span></Link>
      <nav>{nav.map(([href,label,Icon]) => <Link key={href} href={href} className={`navlink ${pathname === href.split("?")[0] ? "active" : ""}`}><Icon size={22}/><span className="label">{label}</span></Link>)}</nav>
      <Link href="/new"><button className="primary"><Plus size={18} style={{display:"inline",marginRight:6}}/>Novo Prompt</button></Link>
      <button className="navlink" onClick={logout} style={{border:0,background:"transparent",width:"100%"}}><LogOut size={22}/><span className="label">Sair</span></button>
    </aside>
    <main className="feed">{children}</main>
    <aside className="rightbar">
      <input className="search" placeholder="Buscar prompts..." />
      <div className="sidebox"><h3>Categorias</h3><p className="meta">Banco de Dados</p><p className="meta">Desenvolvimento</p><p className="meta">IA</p><p className="meta">Automação</p></div>
      <div className="sidebox"><h3>PromptHub</h3><p className="meta">Prompts privados ficam isolados por usuário. Prompts públicos podem ser descobertos pela comunidade.</p></div>
    </aside>
    <nav className="mobilebar">
      <Link href="/dashboard"><Home size={23}/></Link><Link href="/dashboard?scope=public"><Search size={23}/></Link>
      <Link href="/new"><Plus size={28}/></Link><Link href="/dashboard?scope=favorites"><Star size={23}/></Link><Link href="/profile"><User size={23}/></Link>
    </nav>
  </div>;
}
