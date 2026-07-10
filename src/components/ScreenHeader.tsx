import type { ReactNode } from "react";

interface ScreenHeaderProps {
  code: string;
  title: string;
  aside?: ReactNode;
}

export function ScreenHeader({ code, title, aside }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-title-group">
        <span className="screen-kicker">{code}</span>
        <h1>{title}</h1>
      </div>
      {aside ? <div className="screen-header-aside">{aside}</div> : null}
    </header>
  );
}
