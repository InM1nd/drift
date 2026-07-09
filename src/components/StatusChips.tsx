import type { Status } from "../types";

const ICONS: Record<Status, string> = {
  corrosion: "☣",
  overdrive: "⚡",
  stabilization: "🛡+",
  jamming: "📡",
  breach: "💥",
};

export function StatusChips({ statuses }: { statuses: Partial<Record<Status, number>> }) {
  const entries = Object.entries(statuses).filter(([, v]) => (v ?? 0) > 0) as [Status, number][];
  if (entries.length === 0) return null;
  return (
    <div className="status-chips">
      {entries.map(([status, stacks]) => (
        <span key={status} className={`status-chip status-${status}`}>
          {ICONS[status]} {stacks}
        </span>
      ))}
    </div>
  );
}
