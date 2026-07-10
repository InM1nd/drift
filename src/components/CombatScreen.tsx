import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { combatMachine } from "../engine/combatMachine";
import { createInitialCombatState } from "../engine/combatState";
import type { CombatState, EnemyCombatantState } from "../engine/combatState";
import { computeDamage } from "../engine/resolveEffect";
import { peekNextMove } from "../engine/enemyAi";
import { getCardById } from "../data/cards";
import { getInjectorById } from "../data/injectors";
import { getMapNodeById } from "../data/mapNodes";
import { useRunStore } from "../state/runStore";
import { GameMenu } from "./GameMenu";
import { AttackIcon, RepairIcon, ShieldIcon, type PixelInjectorKind } from "./icons";
import { STATUS_ICONS } from "./statusIcons";
import { PixelCombatLayout } from "./pixel/PixelCombatLayout";
import "./CombatScreen.css";

const PHASE_LABELS: Record<string, string> = {
  playerTurn: "Ваш ход",
  endingTurn: "Передача хода",
  enemyTurn: "Ответ противника",
  victory: "Сектор очищен",
  defeat: "Связь потеряна",
};

function cardNeedsTarget(cardId: string): boolean {
  const card = getCardById(cardId);
  return card.effects.some((effect) => (effect.kind === "damage" || effect.kind === "applyStatus") && effect.target === "enemy");
}

function cardEffectiveCost(cardId: string, combat: CombatState): number {
  const card = getCardById(cardId);
  if (card.cost === "X") return combat.player.energy;
  return Math.max(0, card.cost - combat.player.nextCardCostReduction);
}

function usesTouchInspection(): boolean {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}

function intentFor(enemy: EnemyCombatantState, combat: CombatState): { icon: ReactNode; text: ReactNode } | null {
  if (enemy.hp <= 0) return null;
  const player = combat.player;
  const move = peekNextMove(enemy);
  switch (move.kind) {
    case "damage":
      return { icon: <AttackIcon className="intent-icon" />, text: String(computeDamage(enemy, player, move.amount)) };
    case "block":
      return { icon: <ShieldIcon className="intent-icon" />, text: String(move.amount) };
    case "applyStatus":
      return { icon: STATUS_ICONS[move.status], text: `+${move.stacks}` };
    case "summon":
      return { icon: <RepairIcon className="intent-icon" />, text: "?" };
    case "damageWithStatus":
      return {
        icon: <AttackIcon className="intent-icon" />,
        text: <>{computeDamage(enemy, player, move.amount)}+{STATUS_ICONS[move.status]}{move.stacks}</>,
      };
    case "damagePerCardPlayed": {
      // Живой прогноз "если ход закончится прямо сейчас" — обновляется по мере
      // розыгрыша карт, т.к. итоговое число карт за ход ещё не решено игроком.
      const base = move.perCard * combat.cardsPlayedThisTurn;
      return {
        icon: <AttackIcon className="intent-icon" />,
        text: `${computeDamage(enemy, player, base)} (x${move.perCard}/карта)`,
      };
    }
  }
}

export function CombatScreen() {
  const node = useRunStore((s) => getMapNodeById(s.mapNodes, s.currentNodeId));
  const deck = useRunStore((s) => s.deck);
  const playerHp = useRunStore((s) => s.player.hp);
  const playerMaxHp = useRunStore((s) => s.player.maxHp);
  const combatSeed = useRunStore((s) => s.combatSeed);
  const activeCombatState = useRunStore((s) => s.activeCombatState);
  const ownedModuleIds = useRunStore((s) => s.ownedModuleIds);
  const carriedOverdrive = useRunStore((s) => s.carriedOverdrive);
  const injectorIds = useRunStore((s) => s.injectorIds);

  const [state, send] = useMachine(combatMachine, {
    input: {
      combat:
        activeCombatState ??
        createInitialCombatState(playerHp, deck, node.enemyIds ?? [], combatSeed ?? Date.now(), {
          playerMaxHp,
          modules: ownedModuleIds,
          carriedOverdrive,
          injectorIds,
        }),
    },
  });
  const combat = state.context.combat;
  const isPlayerTurn = state.value === "playerTurn";
  const phaseLabel = PHASE_LABELS[String(state.value)] ?? String(state.value);
  const selectedCardId = combat.selectedHandIndex === null ? null : combat.hand[combat.selectedHandIndex];
  const selectedInjectorId =
    combat.selectedInjectorIndex === null ? null : combat.injectors[combat.selectedInjectorIndex];
  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null;
  const selectedInjector = selectedInjectorId ? getInjectorById(selectedInjectorId) : null;
  const selectedAction = selectedCard?.name ?? selectedInjector?.name ?? "Действие не выбрано";
  const playerHpPercent = Math.max(0, (combat.player.hp / combat.player.maxHp) * 100);
  const [combatNotice, setCombatNotice] = useState<{ text: string; kind: "system" | "warning" | "damage" } | null>(null);
  const [inspectedCardIndex, setInspectedCardIndex] = useState<number | null>(null);
  const selectedCardNeedsTarget = selectedCardId ? cardNeedsTarget(selectedCardId) : false;
  const targetingActive = selectedCardNeedsTarget || selectedInjector !== null;
  const lowHull = playerHpPercent <= 30;
  const hasStatuses =
    Object.keys(combat.player.statuses).length > 0 || combat.enemies.some((enemy) => Object.keys(enemy.statuses).length > 0);
  const logPulse = useMemo(() => {
    const line = combat.log.at(-1);
    if (!line) return null;
    if (line.includes("урона")) return { kind: "damage" as const, text: line };
    if (line.includes("получ")) return { kind: "warning" as const, text: line };
    return { kind: "system" as const, text: line };
  }, [combat.log]);

  // Зеркалим состояние боя в runStore при каждом изменении — это и есть
  // снапшот для восстановления после перезагрузки (см. runStore.ts).
  useEffect(() => {
    useRunStore.getState().updateActiveCombat(combat);
  }, [combat]);

  useEffect(() => {
    if (!logPulse) return;
    setCombatNotice(logPulse);
    const timeout = window.setTimeout(() => setCombatNotice(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [logPulse]);

  function injectorGlyphKind(id: string): PixelInjectorKind {
    if (id === "overdrive-stim") return "overdriveStim";
    if (id === "shield-injector") return "shieldInjector";
    if (id === "combat-stimulant") return "combatStimulant";
    if (id === "medgel") return "medgel";
    if (id === "reactor-booster") return "reactorBooster";
    return "empInjector";
  }

  useEffect(() => {
    if (!targetingActive) return;
    if (window.localStorage.getItem("drift-hint-targeting-seen")) return;
    setCombatNotice({ kind: "system", text: "Подсказка: выбери цель в театре, чтобы подтвердить протокол." });
    window.localStorage.setItem("drift-hint-targeting-seen", "1");
  }, [targetingActive]);

  useEffect(() => {
    if (!hasStatuses) return;
    if (window.localStorage.getItem("drift-hint-status-seen")) return;
    setCombatNotice({ kind: "system", text: "Подсказка: наведи курсор на статус-чип, чтобы увидеть расшифровку эффекта." });
    window.localStorage.setItem("drift-hint-status-seen", "1");
  }, [hasStatuses]);

  function handleResolved() {
    useRunStore
      .getState()
      .resolveCombat(state.value as "victory" | "defeat", combat.player.hp, combat.player.statuses.overdrive ?? 0);
  }

  function handleSelectCard(index: number) {
    const cardId = combat.hand[index];
    if (!cardId || !isPlayerTurn) return;
    const cost = cardEffectiveCost(cardId, combat);
    const card = getCardById(cardId);
    const isAffordable = card.cost === "X" || combat.player.energy >= cost;
    if (!isAffordable) {
      setCombatNotice({ kind: "warning", text: `Недостаточно заряда. Нужно ${cost}, доступно ${combat.player.energy}.` });
      return;
    }
    send({ type: "SELECT_CARD", index });
  }

  function handleCardActivate(index: number) {
    if (usesTouchInspection() && inspectedCardIndex !== index) {
      setInspectedCardIndex(index);
      return;
    }
    setInspectedCardIndex(null);
    handleSelectCard(index);
  }

  return (
    <>
      <PixelCombatLayout
        cardEffectiveCost={cardEffectiveCost}
        combat={combat}
        combatNotice={combatNotice}
        injectorGlyphKind={injectorGlyphKind}
        inspectedCardIndex={inspectedCardIndex}
        intentForEnemy={intentFor}
        isPlayerTurn={isPlayerTurn}
        lowHull={lowHull}
        nodeLabel={node.label}
        nodeSeed={node.id}
        nodeType={node.type}
        onCardActivate={handleCardActivate}
        onCardBlur={() => {
          if (!usesTouchInspection()) setInspectedCardIndex(null);
        }}
        onCardFocus={(index) => {
          if (!usesTouchInspection()) setInspectedCardIndex(index);
        }}
        onCardMouseEnter={(index) => setInspectedCardIndex(index)}
        onCardMouseLeave={() => setInspectedCardIndex(null)}
        onEndTurn={() => send({ type: "END_TURN" })}
        onResolve={handleResolved}
        onSelectInjector={(index) => send({ type: "SELECT_INJECTOR", index })}
        onTargetEnemy={(index) => send({ type: "TARGET_ENEMY", index })}
        phaseLabel={phaseLabel}
        selectedAction={selectedAction}
        stateValue={String(state.value)}
        targetingActive={targetingActive}
      />
      <GameMenu devTools={{ combat, send }} />
    </>
  );
}
