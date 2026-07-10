import { describe, expect, it } from "vitest";
import type { CombatantState } from "./combatState";
import { createInitialCombatState } from "./combatState";
import {
  applyBlockGain,
  applyDamage,
  endPlayerTurn,
  resolveCardEffects,
  resolveEnemyAction,
  startPlayerTurn,
} from "./resolveEffect";

function combatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return { hp: 30, maxHp: 30, shield: 0, retainShield: false, statuses: {}, ...overrides };
}

describe("applyDamage — формула (база + Форсаж) × Пробоина × Помехи", () => {
  it("совпадает с примером из docs/02-combat.md: 8 базовых → 12 → 12 → 18", () => {
    expect(applyDamage(combatant(), combatant(), 8)).toBe(8);
    expect(applyDamage(combatant({ statuses: { overdrive: 4 } }), combatant(), 8)).toBe(12);
    expect(applyDamage(combatant(), combatant({ statuses: { breach: 1 } }), 8)).toBe(12);
    expect(
      applyDamage(combatant({ statuses: { overdrive: 4 } }), combatant({ statuses: { breach: 1 } }), 8),
    ).toBe(18);
  });

  it("Помехи снижают урон на 25%", () => {
    expect(applyDamage(combatant({ statuses: { jamming: 1 } }), combatant(), 8)).toBe(6);
  });

  it("щит поглощает урон раньше HP", () => {
    const target = combatant({ shield: 5, hp: 20 });
    const dealt = applyDamage(combatant(), target, 8);
    expect(dealt).toBe(8);
    expect(target.shield).toBe(0);
    expect(target.hp).toBe(17); // 20 - (8 - 5)
  });
});

describe("applyBlockGain — база + Стабилизация", () => {
  it("добавляет стеки стабилизации к получаемому щиту", () => {
    const target = combatant({ statuses: { stabilization: 2 } });
    expect(applyBlockGain(target, 5)).toBe(7);
    expect(target.shield).toBe(7);
  });
});

describe("динамические значения карт", () => {
  it("Контрудар: урон = текущий щит игрока", () => {
    const state = createInitialCombatState(70, ["counterstrike"], ["hull-turret"], 1);
    state.player.shield = 9;
    state.targetEnemyIndex = 0;
    resolveCardEffects({ id: "counterstrike", name: "Контрудар", cost: 1, type: "attack", tags: [], description: "", effects: [{ kind: "damage", amount: { ref: "shield" }, target: "enemy" }] }, state);
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 9);
  });

  it("Цепная реакция: урон = карт сыграно в этот ход × 3", () => {
    const state = createInitialCombatState(70, ["chain-reaction"], ["hull-turret"], 1);
    state.cardsPlayedThisTurn = 4;
    state.targetEnemyIndex = 0;
    resolveCardEffects(
      { id: "chain-reaction", name: "Цепная реакция", cost: 2, type: "attack", tags: [], description: "", exhaust: true, effects: [{ kind: "damage", amount: { ref: "cardsPlayedThisTurn", mult: 3 }, target: "enemy" }] },
      state,
    );
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 12);
  });

  it("Финал распада: урон = стек Коррозии на цели × 2", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.targetEnemyIndex = 0;
    state.enemies[0].statuses.corrosion = 5;
    resolveCardEffects(
      { id: "decay-finisher", name: "Финал распада", cost: 2, type: "attack", tags: [], description: "", exhaust: true, effects: [{ kind: "damage", amount: { ref: "corrosionOnTarget", mult: 2 }, target: "enemy" }] },
      state,
    );
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 10);
  });
});

describe("resolveEnemyAction — ходы Стража-гексапода (docs/04-enemies.md)", () => {
  it("damageWithStatus: урон и статус на игрока одним ходом", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    resolveEnemyAction({ kind: "damageWithStatus", amount: 8, status: "breach", stacks: 1 }, state.enemies[0], state);
    expect(state.player.hp).toBe(62);
    expect(state.player.statuses.breach).toBe(1);
  });

  it("damagePerCardPlayed: берёт cardsPlayedThisTurn, а не размер руки — рука уже сброшена к ходу врага (docs/02-combat.md)", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.cardsPlayedThisTurn = 3;
    state.hand = [];
    resolveEnemyAction({ kind: "damagePerCardPlayed", perCard: 4 }, state.enemies[0], state);
    expect(state.player.hp).toBe(58);
  });
});

describe("Уровень угрозы — threatDamageMult масштабирует урон врагов по игроку (docs/11-threat-level.md)", () => {
  it("damage: округляется вверх", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { threatDamageMult: 1.15 });
    resolveEnemyAction({ kind: "damage", amount: 5 }, state.enemies[0], state);
    expect(state.player.hp).toBe(70 - Math.ceil(5 * 1.15)); // 70 - 6 = 64
  });

  it("damageWithStatus: тоже масштабируется", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { threatDamageMult: 1.15 });
    resolveEnemyAction({ kind: "damageWithStatus", amount: 8, status: "breach", stacks: 1 }, state.enemies[0], state);
    expect(state.player.hp).toBe(70 - Math.ceil(8 * 1.15)); // 70 - 10 = 60
  });

  it("damagePerCardPlayed: множитель применяется к итоговой базе (perCard × сыгранные карты)", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { threatDamageMult: 1.15 });
    state.cardsPlayedThisTurn = 3;
    resolveEnemyAction({ kind: "damagePerCardPlayed", perCard: 4 }, state.enemies[0], state);
    expect(state.player.hp).toBe(70 - Math.ceil(4 * 3 * 1.15)); // 70 - 14 = 56
  });

  it("без модификатора (по умолчанию) поведение не меняется", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    resolveEnemyAction({ kind: "damage", amount: 5 }, state.enemies[0], state);
    expect(state.player.hp).toBe(65);
  });

  it("Отражение не масштабируется threatDamageMult — контрудар считается от stacks игрока, не от урона врага", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { threatDamageMult: 1.15 });
    state.player.statuses.reflect = 3;
    resolveEnemyAction({ kind: "damage", amount: 5 }, state.enemies[0], state);
    expect(state.player.hp).toBe(70 - Math.ceil(5 * 1.15)); // получил усиленный урон
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 3); // но отразил ровно 3, не 3×1.15
  });
});

describe("summon — разовое подкрепление Ядра-Стража (docs/04-enemies.md)", () => {
  it("призывает нового врага в state.enemies", () => {
    const state = createInitialCombatState(70, ["strike"], ["core-guardian"], 1);
    expect(state.enemies).toHaveLength(1);
    resolveEnemyAction({ kind: "summon", enemyId: "sanitation-drone" }, state.enemies[0], state);
    expect(state.enemies).toHaveLength(2);
    expect(state.enemies[1].enemyId).toBe("sanitation-drone");
    expect(state.enemies[1].hp).toBeGreaterThan(0);
  });

  it("повторный призыв — no-op, если уже призывал в этом бою («разовая подмога»)", () => {
    const state = createInitialCombatState(70, ["strike"], ["core-guardian"], 1);
    resolveEnemyAction({ kind: "summon", enemyId: "sanitation-drone" }, state.enemies[0], state);
    resolveEnemyAction({ kind: "summon", enemyId: "sanitation-drone" }, state.enemies[0], state);
    expect(state.enemies).toHaveLength(2);
  });
});

describe("applyStatus (одиночная цель) — onlyIfPresent (Токсичный клинок)", () => {
  const toxicBlade = {
    id: "toxic-blade",
    name: "Токсичный клинок",
    cost: 1,
    type: "attack" as const,
    tags: [],
    description: "",
    effects: [{ kind: "applyStatus" as const, status: "corrosion" as const, stacks: 2, target: "enemy" as const, onlyIfPresent: true }],
  };

  it("не накладывает статус, если на цели его ещё нет", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.targetEnemyIndex = 0;
    resolveCardEffects(toxicBlade, state);
    expect(state.enemies[0].statuses.corrosion ?? 0).toBe(0);
  });

  it("накладывает статус поверх уже существующего", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.targetEnemyIndex = 0;
    state.enemies[0].statuses.corrosion = 1;
    resolveCardEffects(toxicBlade, state);
    expect(state.enemies[0].statuses.corrosion).toBe(3);
  });
});

describe("discard — сброс карт из руки (Каскад команд)", () => {
  it("сбрасывает запрошенное число карт", () => {
    const state = createInitialCombatState(70, ["strike", "strike", "strike", "strike", "strike"], ["hull-turret"], 1);
    const handBefore = state.hand.length;
    resolveCardEffects(
      { id: "cascade", name: "Каскад команд", cost: 1, type: "skill", tags: [], description: "", effects: [{ kind: "discard", count: 1 }] },
      state,
    );
    expect(state.hand.length).toBe(handBefore - 1);
    expect(state.discardPile.length).toBe(1);
  });
});

describe("energySpent — Всплеск мощности", () => {
  it("ref:energySpent читает lastCardCost (записывается playCard при розыгрыше X-карты)", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.targetEnemyIndex = 0;
    state.lastCardCost = 3;
    resolveCardEffects(
      {
        id: "power-surge",
        name: "Всплеск мощности",
        cost: "X",
        type: "attack",
        tags: [],
        exhaust: true,
        description: "",
        effects: [{ kind: "damage", amount: { ref: "energySpent", mult: 2 }, target: "enemy" }],
      },
      state,
    );
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 6);
  });
});

describe("reflect — Отражающая плита", () => {
  it("отражает урон атакующему при получении удара", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.player.statuses.reflect = 3;
    resolveEnemyAction({ kind: "damage", amount: 5 }, state.enemies[0], state);
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 3);
  });

  it("гасится целиком в конце хода — это флаг 'в этот ход', не длительность в стеках", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.player.statuses.reflect = 3;
    endPlayerTurn(state);
    expect(state.player.statuses.reflect).toBeUndefined();
  });
});

describe("Форсаж/Стабилизация — «на оставшийся бой», не тикают (docs/02-combat.md)", () => {
  it("Форсаж переживает конец хода без декремента", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.player.statuses.overdrive = 2;
    endPlayerTurn(state);
    expect(state.player.statuses.overdrive).toBe(2);
    endPlayerTurn(state);
    expect(state.player.statuses.overdrive).toBe(2);
  });

  it("Стабилизация переживает конец хода без декремента", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.player.statuses.stabilization = 3;
    endPlayerTurn(state);
    expect(state.player.statuses.stabilization).toBe(3);
  });

  it("контраст: Помехи и Пробоина тикают вниз каждый ход (длительность в ходах)", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.player.statuses.jamming = 2;
    state.enemies[0].statuses.breach = 1;
    endPlayerTurn(state);
    expect(state.player.statuses.jamming).toBe(1);
    expect(state.enemies[0].statuses.breach).toBeUndefined();
  });
});

describe("doubleNextAttack — Боевой стимулятор (Инъектор)", () => {
  it("удваивает урон следующего эффекта damage от игрока, затем сбрасывается", () => {
    const state = createInitialCombatState(70, ["strike", "strike"], ["hull-turret"], 1);
    state.targetEnemyIndex = 0;
    resolveCardEffects(
      { id: "stim", name: "Боевой стимулятор", cost: 0, type: "skill", tags: [], description: "", effects: [{ kind: "doubleNextAttack" }] },
      state,
    );
    expect(state.player.doubleNextAttack).toBe(true);
    resolveCardEffects(
      { id: "strike", name: "Залп", cost: 1, type: "attack", tags: [], description: "", effects: [{ kind: "damage", amount: 6, target: "enemy" }] },
      state,
    );
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 12);
    expect(state.player.doubleNextAttack).toBe(false);
    resolveCardEffects(
      { id: "strike", name: "Залп", cost: 1, type: "attack", tags: [], description: "", effects: [{ kind: "damage", amount: 6, target: "enemy" }] },
      state,
    );
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 18);
  });
});

describe("Модули — реальные хуки в бою (docs/05-items.md)", () => {
  it("Нанитный резервуар: Коррозия на враге не уменьшается сама по себе", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { modules: ["nanite-reservoir"] });
    state.enemies[0].statuses.corrosion = 3;
    endPlayerTurn(state);
    expect(state.enemies[0].statuses.corrosion).toBe(3); // урон нанесён, стек не упал
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 3);
  });

  it("без модуля Коррозия на враге тикает вниз как обычно", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.enemies[0].statuses.corrosion = 3;
    endPlayerTurn(state);
    expect(state.enemies[0].statuses.corrosion).toBe(2);
  });

  it("Отражающая обшивка: в конце хода наносит врагу урон = Щиту игрока", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { modules: ["reflective-hull"] });
    state.player.shield = 6;
    state.targetEnemyIndex = 0;
    endPlayerTurn(state);
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 6);
  });

  it("Взломанный чип приоритета: скидка есть уже в ходу 1 (createInitialCombatState минует startPlayerTurn)", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { modules: ["priority-chip"] });
    expect(state.player.nextCardCostReduction).toBe(1);
  });

  it("Взломанный чип приоритета: скидка снова выставляется на каждом следующем ходу", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, { modules: ["priority-chip"] });
    state.player.nextCardCostReduction = 0; // как будто уже потрачена на карту в ходу 1
    startPlayerTurn(state, 5);
    expect(state.player.nextCardCostReduction).toBe(1);
  });
});
