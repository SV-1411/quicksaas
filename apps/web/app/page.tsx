import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-semibold">Gigzs Platform Console</h1>
      <p className="text-muted-foreground">Backend-first B2B execution platform dashboards.</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Link className="rounded-lg border p-4 hover:bg-muted" href="/client">
          Client Dashboard
        </Link>
        <Link className="rounded-lg border p-4 hover:bg-muted" href="/freelancer">
          Freelancer Dashboard
        </Link>
        <Link className="rounded-lg border p-4 hover:bg-muted" href="/admin">
          Admin Dashboard
        </Link>
      </div>
    </main>
  );
}
