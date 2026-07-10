import type { CSSProperties, ReactNode } from "react";

interface PixelPanelProps {
  children: ReactNode;
  className?: string;
}

interface PixelMedallionProps {
  children: ReactNode;
  className?: string;
}

interface PixelMeterProps {
  label: string;
  value: number;
  max: number;
  tone?: "accent" | "energy" | "danger" | "stabilization";
  compact?: boolean;
}

export function PixelPanel({ children, className }: PixelPanelProps) {
  return <div className={`pixel-panel${className ? ` ${className}` : ""}`}>{children}</div>;
}

export function PixelMedallion({ children, className }: PixelMedallionProps) {
  return <span className={`pixel-medallion${className ? ` ${className}` : ""}`}>{children}</span>;
}

export function PixelMeter({ label, value, max, tone = "accent", compact = false }: PixelMeterProps) {
  const safeMax = Math.max(1, max);
  const safeValue = Math.max(0, Math.min(value, safeMax));
  const fillPercent = (safeValue / safeMax) * 100;
  const style = { "--pixel-meter-fill": `${fillPercent}%` } as CSSProperties;

  return (
    <div className={`pixel-meter pixel-meter-${tone}${compact ? " pixel-meter-compact" : ""}`} style={style}>
      <span className="pixel-meter-label">{label}</span>
      <strong className="pixel-meter-value">
        {safeValue}
        <small>/{safeMax}</small>
      </strong>
      <span aria-hidden="true" className="pixel-meter-track">
        <i />
      </span>
    </div>
  );
}
