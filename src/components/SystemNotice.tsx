import type { ReactNode } from "react";

interface SystemNoticeProps {
  kind: "success" | "warning" | "damage" | "system";
  message: string;
  actions?: ReactNode;
}

export function SystemNotice({ kind, message, actions }: SystemNoticeProps) {
  return (
    <aside aria-live="polite" className={`system-notice system-notice-${kind}`} role="status">
      <span className="system-notice-label">
        {kind === "success" && "Подтверждено"}
        {kind === "warning" && "Внимание"}
        {kind === "damage" && "Тревога"}
        {kind === "system" && "Система"}
      </span>
      <p>{message}</p>
      {actions ? <div className="system-notice-actions">{actions}</div> : null}
    </aside>
  );
}
