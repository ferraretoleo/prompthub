"use client";

export default function ErrorPage({
  reset
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <main className="statusPage">
      <img
        src="/icons/icon-192.png"
        alt="PromptHub"
      />

      <h1>
        Algo deu errado
      </h1>

      <p>
        Não foi possível concluir esta
        operação. Tente novamente.
      </p>

      <button
        className="buttonPrimary"
        onClick={reset}
      >
        Tentar novamente
      </button>
    </main>
  );
}
