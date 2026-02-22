import ConfigForm from "@/components/ConfigForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Hero header ─────────────────────────────────────── */}
      <header className="pt-16 pb-10 text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-accent">
          Deadlock Detection System
        </h1>
        <p className="text-lg md:text-xl text-foreground/60 font-light">
          OS Mini Project — Resource Allocation Graph &amp; Deadlock Detection
        </p>
      </header>

      {/* ── Config form ─────────────────────────────────────── */}
      <div className="px-4 pb-20">
        <ConfigForm />
      </div>
    </main>
  );
}
