export type VisualStyle = "hud" | "pixel";

interface VisualStyleSwitchProps {
  style: VisualStyle;
  onChange: (style: VisualStyle) => void;
}

export function VisualStyleSwitch({ style, onChange }: VisualStyleSwitchProps) {
  return (
    <div aria-label="Визуальный стиль" className="visual-style-switch" role="group">
      <button aria-pressed={style === "hud"} className={style === "hud" ? "active" : ""} onClick={() => onChange("hud")} type="button">
        HUD
      </button>
      <button aria-pressed={style === "pixel"} className={style === "pixel" ? "active" : ""} onClick={() => onChange("pixel")} type="button">
        PIXEL
      </button>
    </div>
  );
}
