export default function PageHeader({
  title,
  description,
  actions,
  marker,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  marker?: string;
}) {
  return (
    <header className="mb-10 animate-rise">
      {marker && (
        <div className="section-marker mb-3">
          <span>§ {marker}</span>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 pb-5 hairline-strong border-t-0">
        <div className="max-w-2xl">
          <h1 className="display text-5xl md:text-6xl text-balance">{title}</h1>
          {description && (
            <p className="mt-4 text-[15px] text-ink-muted leading-relaxed text-pretty">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 md:pb-1.5">{actions}</div>
        )}
      </div>
      <div className="hairline mt-0" />
      <div className="hairline mt-1" />
    </header>
  );
}
