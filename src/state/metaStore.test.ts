import { describe, expect, it } from "vitest";
import { useMetaStore } from "./metaStore";

describe("metaStore — разблокировка Уровня угрозы, переживает startNewRun (docs/11-threat-level.md)", () => {
  it("по умолчанию не разблокировано", () => {
    useMetaStore.setState({ threatLevelsUnlocked: false });
    expect(useMetaStore.getState().threatLevelsUnlocked).toBe(false);
  });

  it("unlockThreatLevels разблокирует", () => {
    useMetaStore.setState({ threatLevelsUnlocked: false });
    useMetaStore.getState().unlockThreatLevels();
    expect(useMetaStore.getState().threatLevelsUnlocked).toBe(true);
  });
});
