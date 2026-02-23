export default function ClientDashboard() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Client Dashboard</h1>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border p-4">
          <h2 className="font-medium">Create Project</h2>
          <p className="text-sm text-muted-foreground">Submit requirements for automated planning.</p>
        </article>
        <article className="rounded-lg border p-4">
          <h2 className="font-medium">Project Progress Timeline</h2>
          <p className="text-sm text-muted-foreground">Track every module checkpoint and milestone.</p>
        </article>
        <article className="rounded-lg border p-4">
          <h2 className="font-medium">Live Module Status</h2>
          <p className="text-sm text-muted-foreground">Frontend, backend, integrations, and deployment visibility.</p>
        </article>
        <article className="rounded-lg border p-4">
          <h2 className="font-medium">Deployment Preview + Invoice</h2>
          <p className="text-sm text-muted-foreground">See build previews and billing summary in one place.</p>
        </article>
      </section>
    </main>
  );
}
