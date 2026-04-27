import { STATUSES, statusColor, statusDot } from "@/lib/utils";

export default function StatusPill({
  status,
  withDot = true,
}: {
  status: string;
  withDot?: boolean;
}) {
  const label = STATUSES.find((s) => s.id === status)?.label ?? status;
  return (
    <span className={`pill ${statusColor(status)} gap-1.5`}>
      {withDot && (
        <span
          aria-hidden
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: statusDot(status) }}
        />
      )}
      {label}
    </span>
  );
}
