import { describe, expect, it } from "vitest";
import { createRng, nextFloat, shuffle } from "./rng";

describe("rng", () => {
  it("одинаковый сид даёт одинаковую последовательность", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [nextFloat(a), nextFloat(a), nextFloat(a)];
    const seqB = [nextFloat(b), nextFloat(b), nextFloat(b)];
    expect(seqA).toEqual(seqB);
  });

  it("разные сиды расходятся", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(nextFloat(a)).not.toBe(nextFloat(b));
  });

  it("значения всегда в [0, 1)", () => {
    const state = createRng(7);
    for (let i = 0; i < 100; i++) {
      const v = nextFloat(state);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("shuffle с тем же сидом детерминирован и сохраняет элементы", () => {
    const deck = ["a", "b", "c", "d", "e"];
    const shuffledA = shuffle(createRng(99), deck);
    const shuffledB = shuffle(createRng(99), deck);
    expect(shuffledA).toEqual(shuffledB);
    expect([...shuffledA].sort()).toEqual([...deck].sort());
  });
});
