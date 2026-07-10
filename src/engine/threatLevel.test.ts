import { describe, expect, it } from "vitest";
import { getThreatModifiers, MAX_THREAT_LEVEL } from "./threatLevel";

describe("getThreatModifiers — кумулятивные уровни (docs/11-threat-level.md)", () => {
  it("уровень 0 — нейтральные множители, база экономики", () => {
    expect(getThreatModifiers(0)).toEqual({
      enemyHpMult: 1,
      eliteBossHpMult: 1,
      enemyDamageMult: 1,
      startingCreditsDelta: 0,
      injectorDropChancePct: 50,
    });
  });

  it("каждый следующий уровень не мягче предыдущего ни по одному рычагу (кумулятивность)", () => {
    for (let level = 1; level <= MAX_THREAT_LEVEL; level++) {
      const prev = getThreatModifiers(level - 1);
      const cur = getThreatModifiers(level);
      expect(cur.enemyHpMult).toBeGreaterThanOrEqual(prev.enemyHpMult);
      expect(cur.eliteBossHpMult).toBeGreaterThanOrEqual(prev.eliteBossHpMult);
      expect(cur.enemyDamageMult).toBeGreaterThanOrEqual(prev.enemyDamageMult);
      expect(cur.startingCreditsDelta).toBeLessThanOrEqual(prev.startingCreditsDelta);
      expect(cur.injectorDropChancePct).toBeLessThanOrEqual(prev.injectorDropChancePct);
    }
  });

  it("значения вне диапазона зажимаются к [0, MAX_THREAT_LEVEL]", () => {
    expect(getThreatModifiers(-3)).toEqual(getThreatModifiers(0));
    expect(getThreatModifiers(99)).toEqual(getThreatModifiers(MAX_THREAT_LEVEL));
  });

  it("уровень 5 включает все пять рычагов сразу", () => {
    const m = getThreatModifiers(MAX_THREAT_LEVEL);
    expect(m).toEqual({
      enemyHpMult: 1.15,
      eliteBossHpMult: 1.15,
      enemyDamageMult: 1.15,
      startingCreditsDelta: -20,
      injectorDropChancePct: 25,
    });
  });
});
