import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.2fr,1fr]">
      <aside className="hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-ink/15 bg-paper-deep/40 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -left-32 size-96 rounded-full bg-status-offer/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -right-32 size-[28rem] rounded-full bg-accent/10 blur-3xl"
        />
        <header className="relative">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
            <span>The Career Ledger</span>
            <span>{today}</span>
          </div>
          <div className="hairline-strong border-t-0 mt-3" />
          <div className="hairline mt-1" />
          <div className="hairline mt-1" />
        </header>

        <div className="relative">
          <div className="eyebrow-accent mb-4">A new edition</div>
          <h1 className="display text-[88px] xl:text-[112px] leading-[0.88] text-balance">
            Open your
            <br />
            <span className="display-italic text-accent">ledger</span>
            <br />
            today.
          </h1>
          <p className="mt-8 max-w-md text-[15px] text-ink-muted leading-relaxed text-pretty">
            Free, private, and built for the long haul. Your applications, your
            templates, your reminders — all on one continuous page.
          </p>
        </div>

        <footer className="relative">
          <div className="hairline pt-4 grid grid-cols-3 gap-4">
            <Stat label="Setup time" value="< 1 min" />
            <Stat label="Cost" value="Free" />
            <Stat label="Tracking" value="In-app" />
          </div>
        </footer>
      </aside>

      <main className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <div className="eyebrow-accent">№ 01 · The</div>
            <div className="display text-4xl mt-1">
              Career
              <span className="display-italic text-accent"> Ledger</span>
            </div>
          </div>
          <div className="mb-7">
            <div className="eyebrow-accent">Register</div>
            <h2 className="display text-3xl mt-1">Make it official.</h2>
            <p className="mt-2 text-sm text-ink-muted">
              A fresh page, ready for your first entry.
            </p>
          </div>
          <RegisterForm />
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle">
        {label}
      </div>
      <div className="display text-xl mt-1">{value}</div>
    </div>
  );
}
