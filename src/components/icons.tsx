import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconFrame({ children, className, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={`game-icon${className ? ` ${className}` : ""}`}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function AttackIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M5 19 19 5m-6 0h6v6" /></IconFrame>;
}

export function ShieldIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m12 2 7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4Z" /></IconFrame>;
}

export function RepairIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M12 5v14M5 12h14" /></IconFrame>;
}

export function CorrosionIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
      <circle cx="8.6" cy="14" r="1" fill="currentColor" />
      <circle cx="15.4" cy="14" r="1" fill="currentColor" />
    </IconFrame>
  );
}

export function OverdriveIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m13 2-8 12h6l-1 8 9-13h-6l0-7Z" /></IconFrame>;
}

export function StabilizationIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="m12 2 7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4Z" />
      <path d="M12 8v8m-4-4h8" />
    </IconFrame>
  );
}

export function JammingIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4 8c2-3 4 3 6 0s4 3 6 0 3 1 4 0" />
      <path d="M4 16c2-3 4 3 6 0s4 3 6 0 3 1 4 0M10 5l4 14" />
    </IconFrame>
  );
}

export function BreachIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="m12 2 7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4Z" />
      <path d="m12 6-2 5 3 1-2 5 4-5-3-1 2-5" />
    </IconFrame>
  );
}

export function ReflectIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m9 14-4-4 4-4M5 10h9a5 5 0 0 1 0 10h-1" /></IconFrame>;
}

export function CompartmentIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m7 4 10 0 4 8-4 8H7l-4-8 4-8Z" /></IconFrame>;
}

export function EliteIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m12 3 6 6-6 6-6-6 6-6Zm0 6 6 6-6 6-6-6 6-6Z" /></IconFrame>;
}

export function SignalIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M12 19V12m0 0 4-4m-4 4L8 8m-3 9a10 10 0 0 1 0-10m14 10a10 10 0 0 0 0-10M8 15a5 5 0 0 1 0-6m8 6a5 5 0 0 0 0-6" /></IconFrame>;
}

export function ShopIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M5 4h14v16H5V4Zm3 4h8m-8 4h5m-5 4h8" /></IconFrame>;
}

export function RestIcon(props: IconProps) {
  return <IconFrame {...props}><circle cx="12" cy="12" r="8" /><path d="M12 8v8m-4-4h8" /></IconFrame>;
}

export function BossIcon(props: IconProps) {
  return <IconFrame {...props}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></IconFrame>;
}

export function HullIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M4 5h16l-2 12-6 3-6-3L4 5Zm3 4h10M8 13h8" /></IconFrame>;
}

export function EnergyIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M13 2 5 14h6l-1 8 9-13h-6V2Z" /></IconFrame>;
}

export function CreditsIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M15.5 8.5A5 5 0 1 0 15.5 15.5M8 12h7M12 5v14" />
    </IconFrame>
  );
}

export function ThreatIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m12 3 9 16H3L12 3Zm0 5v5m0 3v.5" /></IconFrame>;
}

export function SkillIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M4 12h4l2-6 4 12 2-6h4M5 4h14v16H5Z" /></IconFrame>;
}

export function PowerIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m12 2 8 5v10l-8 5-8-5V7l8-5Zm0 5v5l4 2" /></IconFrame>;
}

export function DrawIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M5 5h11v14H5V5Zm3-3h11v14M9 9h3m-3 4h5" /></IconFrame>;
}

export function DiscardIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M5 5h11v14H5V5Zm4 4 4 4m0-4-4 4M8 2h11v14" /></IconFrame>;
}

export function InjectorIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m14 4 6 6M16 2l6 6M5 19l8-8 3 3-8 8H5v-3Zm1-4 3 3" /></IconFrame>;
}

export function ModuleIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M7 7h10v10H7ZM9 2v5m6-5v5M9 17v5m6-5v5M2 9h5m10 0h5M2 15h5m10 0h5" />
      <circle cx="12" cy="12" r="2" />
    </IconFrame>
  );
}

export function LootIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M4 8h16v11H4V8Zm2-4h12l2 4H4l2-4Zm3 8h6m-3-3v6" /></IconFrame>;
}

export function UpgradeIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m12 3 5 5h-3v6h-4V8H7l5-5ZM5 17h14v4H5Z" /></IconFrame>;
}

export function PlayIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M6 4v16l14-8L6 4Z" /></IconFrame>;
}

export function HomeIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M4 11 12 4l8 7M6 10v10h5v-6h2v6h5V10" /></IconFrame>;
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2 2m-9 9-2 2m0-13 2 2m9 9 2 2" />
    </IconFrame>
  );
}
