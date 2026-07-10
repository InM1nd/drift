import type { Status } from "../types";
import { STATUS_DESCRIPTIONS, STATUS_ICONS, STATUS_LABELS } from "./statusIcons";

export function StatusChips({ statuses }: { statuses: Partial<Record<Status, number>> }) {
  const entries = Object.entries(statuses).filter(([, v]) => (v ?? 0) > 0) as [Status, number][];
  if (entries.length === 0) return null;
  return (
    <div className="status-chips">
      {entries.map(([status, stacks]) => (
        <span
          aria-label={`${STATUS_LABELS[status]}: ${stacks}. ${STATUS_DESCRIPTIONS[status]}`}
          className={`status-chip status-${status}`}
          key={status}
          title={`${STATUS_LABELS[status]} — ${STATUS_DESCRIPTIONS[status]}`}
        >
          {STATUS_ICONS[status]} {stacks}
        </span>
      ))}
    </div>
  );
}
