export default function AdminDashboard() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border p-4">Project Overview</article>
        <article className="rounded-lg border p-4">Risk Alerts</article>
        <article className="rounded-lg border p-4">Freelancer Reliability Table</article>
        <article className="rounded-lg border p-4">Revenue Overview</article>
      </section>
    </main>
  );
}
