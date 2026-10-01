"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState
} from "react";
import {
  usePathname,
  useRouter
} from "next/navigation";
import {
  Home,
  Search,
  Library,
  Star,
  Plus,
  User,
  Settings,
  LogOut,
  Bell
} from "lucide-react";

const nav = [
  ["/dashboard", "Visão geral", Home],
  ["/explore", "Explorar", Search],
  ["/dashboard?scope=mine", "Meus Prompts", Library],
  ["/dashboard?scope=favorites", "Favoritos", Star],
  ["/profile", "Perfil", User],
  ["/settings", "Configurações", Settings]
] as const;

type MeResponse = {
  user?: {
    name?: string;
    username?: string;
  };
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/proxy/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<MeResponse>;
      })
      .then((data) => {
        if (!active || !data?.user) return;
        setUsername(data.user.username || data.user.name || "");
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = search.trim();

    router.push(
      q
        ? `/explore?q=${encodeURIComponent(q)}`
        : "/explore"
    );
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="shell">
      <header className="appHeader">
        <Link href="/dashboard" className="headerBrand">
          <img src="/icons/icon-192.png" alt="PromptHub" />
          <span>PromptHub</span>
        </Link>

        <form className="headerSearchWrap" onSubmit={submitSearch}>
          <input
            className="headerSearch"
            placeholder="Pesquisar prompts, autores..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>

        <div className="headerActions">
          <button
            className="headerIconButton"
            type="button"
            aria-label="Notificações"
          >
            <Bell size={17} />
          </button>

          <Link href="/new" className="headerIconButton">
            <Plus size={17} />
            <span>Novo</span>
          </Link>

          <Link href="/profile" className="headerIconButton">
            <User size={17} />
            <span>{username || "Conta"}</span>
          </Link>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebarSection">
          <div className="sidebarTitle">Navegação</div>

          <nav>
            {nav.map(([href, label, Icon]) => {
              const base = href.split("?")[0];

              return (
                <Link
                  key={href}
                  href={href}
                  className={`navlink ${pathname === base ? "active" : ""}`}
                >
                  <Icon size={18} />
                  <span className="label">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebarSection">
          <Link href="/new" className="sidebarCreate">
            <Plus size={16} />
            <span className="label">Novo Prompt</span>
          </Link>
        </div>

        <button
          className="navlink"
          onClick={logout}
          style={{ width: "100%", border: 0, background: "transparent" }}
        >
          <LogOut size={18} />
          <span className="label">Sair</span>
        </button>
      </aside>

      <main className="feed">{children}</main>

      <nav className="mobilebar">
        <Link href="/dashboard"><Home size={22} /></Link>
        <Link href="/explore"><Search size={22} /></Link>
        <Link href="/new"><Plus size={24} /></Link>
        <Link href="/dashboard?scope=favorites"><Star size={22} /></Link>
        <Link href="/profile"><User size={22} /></Link>
      </nav>
    </div>
  );
}
