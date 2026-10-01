import Link from "next/link";

export default function NotFound() {
  return (
    <main className="statusPage">
      <img
        src="/icons/icon-192.png"
        alt="PromptHub"
      />

      <h1>404</h1>

      <h2>
        Página não encontrada
      </h2>

      <p>
        O endereço pode ter mudado,
        sido removido ou não existir.
      </p>

      <Link
        href="/dashboard"
        className="buttonPrimary"
      >
        Voltar ao PromptHub
      </Link>
    </main>
  );
}
