import { AttackIcon, PowerIcon, SkillIcon } from "./icons";

type ProtocolType = "attack" | "skill" | "power";

interface ProtocolIconProps {
  compact?: boolean;
  type: ProtocolType;
}

const PROTOCOL_TYPE_LABELS: Record<ProtocolType, string> = {
  attack: "Атака",
  skill: "Система",
  power: "Контур",
};

export function ProtocolIcon({ compact = false, type }: ProtocolIconProps) {
  const Icon = type === "attack" ? AttackIcon : type === "skill" ? SkillIcon : PowerIcon;

  return (
    <span className={`protocol-type protocol-type-${type}${compact ? " compact" : ""}`} title={PROTOCOL_TYPE_LABELS[type]}>
      <Icon className="protocol-type-icon" />
      <span>{PROTOCOL_TYPE_LABELS[type]}</span>
    </span>
  );
}
