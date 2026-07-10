import { describe, expect, it } from "vitest";
import { createInitialCombatState } from "./combatState";

describe("Уровень угрозы — множители HP при создании боя (docs/11-threat-level.md)", () => {
  it("enemyHpMult масштабирует рядового врага (округление вверх)", () => {
    const base = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    const scaled = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { enemyHpMult: 1.15 });
    expect(scaled.enemies[0].hp).toBe(Math.ceil(base.enemies[0].hp * 1.15));
    expect(scaled.enemies[0].maxHp).toBe(scaled.enemies[0].hp);
  });

  it("enemyHpMult не задевает босса — только eliteBossHpMult", () => {
    const base = createInitialCombatState(70, ["strike"], ["core-guardian"], 1);
    const withEnemyMult = createInitialCombatState(70, ["strike"], ["core-guardian"], 1, { enemyHpMult: 1.15 });
    expect(withEnemyMult.enemies[0].hp).toBe(base.enemies[0].hp);

    const withEliteBossMult = createInitialCombatState(70, ["strike"], ["core-guardian"], 1, { eliteBossHpMult: 1.15 });
    expect(withEliteBossMult.enemies[0].hp).toBe(Math.ceil(base.enemies[0].hp * 1.15));
  });

  it("порог фазы Ядра-Стража остаётся тем же % от maxHp после масштабирования (hp и maxHp растут вместе)", () => {
    const scaled = createInitialCombatState(70, ["strike"], ["core-guardian"], 1, { eliteBossHpMult: 1.15 });
    expect(scaled.enemies[0].hp).toBe(scaled.enemies[0].maxHp);
  });

  it("без опций множители нейтральны — поведение не меняется", () => {
    const withDefaults = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    const explicitNeutral = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, {
      enemyHpMult: 1,
      eliteBossHpMult: 1,
      threatDamageMult: 1,
    });
    expect(explicitNeutral.enemies[0].hp).toBe(withDefaults.enemies[0].hp);
    expect(explicitNeutral.threatDamageMult).toBe(1);
  });
});
