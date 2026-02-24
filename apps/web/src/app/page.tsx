import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold text-primary">AdPageOps</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Monitore Meta Ads por Página. Conecte sua conta, veja anúncios agrupados por página e receba alertas.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 rounded-md border border-border bg-background hover:bg-muted"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          Cadastrar
        </Link>
      </div>
    </main>
  );
}
