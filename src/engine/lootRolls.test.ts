import { describe, expect, it } from "vitest";
import { rollInjectorDrop } from "./lootRolls";
import { createRng } from "./rng";
import { INJECTORS } from "../data/injectors";

describe("rollInjectorDrop — шанс дропа Инъектора за бой (docs/05-items.md: 'дропаются с боёв')", () => {
  it("не гарантирован — на достаточном числе сидов встречаются оба исхода", () => {
    let dropped = 0;
    let missed = 0;
    for (let seed = 0; seed < 200; seed++) {
      if (rollInjectorDrop(createRng(seed), 0, 3)) dropped++;
      else missed++;
    }
    expect(dropped).toBeGreaterThan(0);
    expect(missed).toBeGreaterThan(0);
  });

  it("никогда не дропает, если инвентарь уже полон, независимо от сида", () => {
    for (let seed = 0; seed < 30; seed++) {
      expect(rollInjectorDrop(createRng(seed), 3, 3)).toBeNull();
    }
  });

  it("дропнутый id всегда входит в INJECTORS", () => {
    for (let seed = 0; seed < 100; seed++) {
      const id = rollInjectorDrop(createRng(seed), 0, 3);
      if (id) expect(INJECTORS.some((i) => i.id === id)).toBe(true);
    }
  });
});
