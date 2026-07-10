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
import { EnemySprite, PlayerSprite } from "./CombatSprite";
import { DevPanel } from "./DevPanel";
import { AttackIcon, RepairIcon, ShieldIcon } from "./icons";
import { StatusChips } from "./StatusChips";
import { STATUS_ICONS } from "./statusIcons";
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
  const activeEnemyCount = combat.enemies.filter((enemy) => enemy.hp > 0).length;
  const targetCode =
    combat.targetEnemyIndex === null
      ? "TGT-N/A"
      : `TGT-${String(combat.targetEnemyIndex + 1).padStart(2, "0")}`;
  const selectedCardId = combat.selectedHandIndex === null ? null : combat.hand[combat.selectedHandIndex];
  const selectedInjectorId =
    combat.selectedInjectorIndex === null ? null : combat.injectors[combat.selectedInjectorIndex];
  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null;
  const selectedInjector = selectedInjectorId ? getInjectorById(selectedInjectorId) : null;
  const selectedAction = selectedCard?.name ?? selectedInjector?.name ?? "Протокол не выбран";
  const playerHpPercent = Math.max(0, (combat.player.hp / combat.player.maxHp) * 100);
  const playerEnergyPercent = Math.max(0, (combat.player.energy / combat.player.maxEnergy) * 100);
  const [combatNotice, setCombatNotice] = useState<{ text: string; kind: "system" | "warning" | "damage" } | null>(null);
  const selectedCardNeedsTarget = selectedCardId ? cardNeedsTarget(selectedCardId) : false;
  const targetingActive = selectedCardNeedsTarget || selectedInjector !== null;
  const lowHull = playerHpPercent <= 30;
  const targetingLabel = targetingActive ? "Выбери цель для подтверждения." : targetCode;
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

  return (
    <div className="combat-screen">
      <header className="top-bar">
        <span className="turn-index"><small>Цикл</small>{String(combat.turn + 1).padStart(2, "0")}</span>
        <span className="location"><small>Сектор</small><strong>{node.label}</strong></span>
        <span className="phase"><i aria-hidden="true" />{phaseLabel}</span>
      </header>

      <section className="combat-theatre" aria-label="Сканирующая область">
        <div className="scanner-telemetry">
          <span>Сканер // контактов {activeEnemyCount}</span>
          <span>{targetingLabel}</span>
        </div>
        <div className={`enemy-zone${targetingActive ? " targeting" : ""}`}>
          {combat.enemies.map((enemy, i) => {
            const intent = intentFor(enemy, combat);
            const enemyHealthRatio = enemy.hp / enemy.maxHp;
            return (
              <button
                key={i}
                type="button"
                className={[
                  "enemy",
                  combat.targetEnemyIndex === i ? "targeted" : "",
                  enemyHealthRatio <= 0.5 && enemy.hp > 0 ? "damaged" : "",
                  enemy.hp <= 0 ? "dead" : "",
                ].join(" ")}
                onClick={() => send({ type: "TARGET_ENEMY", index: i })}
                disabled={enemy.hp <= 0 || !isPlayerTurn}
                aria-pressed={combat.targetEnemyIndex === i}
              >
                <div className="enemy-meta">
                  <span>#{String(i + 1).padStart(2, "0")}</span>
                  {intent && (
                    <span className="enemy-intent" title="Намерение противника на следующий ход">
                      {intent.icon} {intent.text}
                    </span>
                  )}
                </div>
                <EnemySprite enemyId={enemy.enemyId} hp={enemy.hp} />
                <div className="enemy-name">{enemy.name}</div>
                <div className="hp-label"><span>Корпус</span><span>{Math.max(0, enemy.hp)}/{enemy.maxHp}</span></div>
                <div className="hp-bar">
                  <div className="hp-fill" style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} />
                </div>
                <div className="hp-text">
                  {enemy.shield > 0 && <span className="shield-value"><ShieldIcon className="inline-icon" /> Щит {enemy.shield}</span>}
                </div>
                <StatusChips statuses={enemy.statuses} />
              </button>
            );
          })}
        </div>
        <div className="scanner-footer" aria-hidden="true">
          <span>{lowHull ? "HULL CRITICAL" : "AZ 180"}</span>
          <span>{targetingActive ? "LOCK ACQUIRE" : "RNG AUTO"}</span>
          <span>LOCK {isPlayerTurn ? "READY" : "HOLD"}</span>
        </div>
        {combatNotice ? <div className={`combat-notice ${combatNotice.kind}`}>{combatNotice.text}</div> : null}
      </section>

      <section className="cockpit-console" aria-label="Консоль боя">
        <div className="console-status">
          <div className="player-panel">
            <PlayerSprite />
            <div className="player-status">
              <div className="vital vital-hp">
                <span className="vital-label">Корпус</span>
                <strong>{combat.player.hp}<small>/{combat.player.maxHp}</small></strong>
                <span className="vital-track"><i style={{ width: `${playerHpPercent}%` }} /></span>
              </div>
              <div className="vital vital-shield">
                <span className="vital-label">Щит</span>
                <strong>{combat.player.shield}</strong>
                <ShieldIcon className="vital-icon" />
              </div>
              <div className="vital vital-energy">
                <span className="vital-label">Заряд</span>
                <strong>{combat.player.energy}<small>/{combat.player.maxEnergy}</small></strong>
                <span className="vital-track"><i style={{ width: `${playerEnergyPercent}%` }} /></span>
              </div>
              <StatusChips statuses={combat.player.statuses} />
            </div>
          </div>

          <div className="log" aria-live="polite">
            <span className="log-label">Журнал</span>
            <div className="log-lines">
              {combat.log.length === 0 && <div>Канал чист // ожидание действия</div>}
              {combat.log.slice(-4).map((line, i) => <div key={i}>{line}</div>)}
            </div>
          </div>
        </div>

        {(state.value === "victory" || state.value === "defeat") && (
          <div className={`outcome-banner ${state.value}`}>
            <div>{state.value === "victory" ? "Победа" : "Поражение"}</div>
            <button type="button" className="continue-button" onClick={handleResolved}>
              {state.value === "victory" ? "Продолжить →" : "Завершить забег"}
            </button>
          </div>
        )}

        <div className="console-heading">
          <span><small>Контур управления</small>Протоколы</span>
          <span className="energy-readout">{targetingActive ? "Режим наведения активен" : "Выбор действий"}</span>
        </div>

        <div className="hand-row">
          {combat.hand.map((cardId, i) => {
            const card = getCardById(cardId);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={combat.selectedHandIndex === i}
                className={`card ${combat.selectedHandIndex === i ? "selected" : ""} ${
                  getCardById(cardId).cost !== "X" && combat.player.energy < cardEffectiveCost(cardId, combat) ? "insufficient" : ""
                }`}
                onClick={() => handleSelectCard(i)}
                disabled={!isPlayerTurn}
              >
                <div className="card-header"><span>{String(i + 1).padStart(2, "0")}</span><div className="card-cost"><small>ЗРД</small>{card.cost}</div></div>
                <div className="card-name">{card.name}</div>
                <div className="card-desc">{card.description}</div>
              </button>
            );
          })}
        </div>

        {combat.injectors.length > 0 && (
          <div className="injector-row">
            {combat.injectors.map((injectorId, i) => {
              const injector = getInjectorById(injectorId);
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={combat.selectedInjectorIndex === i}
                  className={`injector ${combat.selectedInjectorIndex === i ? "selected" : ""}`}
                  onClick={() => send({ type: "SELECT_INJECTOR", index: i })}
                  disabled={!isPlayerTurn}
                >
                  <div className="card-name">{injector.name}</div>
                  <div className="card-desc">{injector.description}</div>
                </button>
              );
            })}
          </div>
        )}

        <div className="console-footer">
          <div className="selection-readout"><small>Активный протокол</small><strong>{selectedAction}</strong></div>
          <button
            type="button"
            className="end-turn"
            onClick={() => send({ type: "END_TURN" })}
            disabled={!isPlayerTurn}
          >
            <span>Завершить</span> ход
          </button>
        </div>
      </section>

      {import.meta.env.DEV && <DevPanel combat={combat} send={send} />}
    </div>
  );
}
