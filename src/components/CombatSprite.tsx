import coreGuardianCorruptedSprite from "../assets/sprites/core-guardian-corrupted.png";
import coreGuardianSprite from "../assets/sprites/core-guardian.png";
import { getEnemyById } from "../data/enemies";
import diverSprite from "../assets/sprites/diver.png";
import guardianHexapodSprite from "../assets/sprites/guardian-hexapod.png";
import hullTurretSprite from "../assets/sprites/hull-turret.png";
import infectedSpecimenSprite from "../assets/sprites/infected-specimen.png";
import sanitationDroneSprite from "../assets/sprites/sanitation-drone.png";

const ENEMY_SPRITES: Record<string, string> = {
  "sanitation-drone": sanitationDroneSprite,
  "hull-turret": hullTurretSprite,
  "infected-specimen": infectedSpecimenSprite,
  "guardian-hexapod": guardianHexapodSprite,
  "core-guardian": coreGuardianSprite,
};

const coreGuardian = getEnemyById("core-guardian");
const CORE_GUARDIAN_PHASE_THRESHOLD =
  coreGuardian.pattern.kind === "phase" ? coreGuardian.pattern.hpThreshold : Number.NEGATIVE_INFINITY;

export function PlayerSprite() {
  return <img alt="" aria-hidden="true" className="combat-sprite player-sprite" src={diverSprite} />;
}

export function EnemySprite({ enemyId, hp }: { enemyId: string; hp: number }) {
  const source =
    enemyId === "core-guardian" && hp <= CORE_GUARDIAN_PHASE_THRESHOLD
      ? coreGuardianCorruptedSprite
      : ENEMY_SPRITES[enemyId];
  if (!source) return null;

  return <img alt="" aria-hidden="true" className={`combat-sprite enemy-sprite sprite--${enemyId}`} src={source} />;
}
