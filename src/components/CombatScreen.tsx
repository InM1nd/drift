import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
import { useSettingsStore } from "../state/settingsStore";
import { EnemySprite, PlayerSprite } from "./CombatSprite";
import { CardEffectSummary, EffectLegend } from "./CardEffectSummary";
import { GameMenu } from "./GameMenu";
import { RoomBackdrop } from "./RoomBackdrop";
import {
  AttackIcon,
  DiscardIcon,
  DrawIcon,
  EnergyIcon,
  HullIcon,
  InjectorIcon,
  PixelInjectorGlyph,
  RepairIcon,
  ShieldIcon,
  type PixelInjectorKind,
} from "./icons";
import { ProtocolIcon } from "./ProtocolIcon";
import { StatusChips } from "./StatusChips";
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
  const visualStyle = useSettingsStore((s) => s.visualStyle);
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
  const selectedCardId = combat.selectedHandIndex === null ? null : combat.hand[combat.selectedHandIndex];
  const selectedInjectorId =
    combat.selectedInjectorIndex === null ? null : combat.injectors[combat.selectedInjectorIndex];
  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null;
  const selectedInjector = selectedInjectorId ? getInjectorById(selectedInjectorId) : null;
  const selectedAction = selectedCard?.name ?? selectedInjector?.name ?? "Действие не выбрано";
  const playerHpPercent = Math.max(0, (combat.player.hp / combat.player.maxHp) * 100);
  const playerEnergyPercent = Math.max(0, (combat.player.energy / combat.player.maxEnergy) * 100);
  const [combatNotice, setCombatNotice] = useState<{ text: string; kind: "system" | "warning" | "damage" } | null>(null);
  const [inspectedCardIndex, setInspectedCardIndex] = useState<number | null>(null);
  const [damageFlashActive, setDamageFlashActive] = useState(false);
  const selectedCardNeedsTarget = selectedCardId ? cardNeedsTarget(selectedCardId) : false;
  const targetingActive = selectedCardNeedsTarget || selectedInjector !== null;
  const lowHull = playerHpPercent <= 30;
  const actionSummary = targetingActive ? `Цель для: ${selectedAction}` : selectedAction;
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
    let flashTimeout: number | undefined;
    if (logPulse.kind === "damage") {
      setDamageFlashActive(true);
      flashTimeout = window.setTimeout(() => setDamageFlashActive(false), 130);
    }
    const timeout = window.setTimeout(() => setCombatNotice(null), 1400);
    return () => {
      window.clearTimeout(timeout);
      if (flashTimeout) window.clearTimeout(flashTimeout);
    };
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

  if (visualStyle === "pixel") {
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

  return (
    <div className={`combat-screen${lowHull ? " low-hull" : ""}${damageFlashActive ? " damage-flash" : ""}`}>
      <header className="top-bar">
        <span className="turn-index"><small>Цикл</small>{String(combat.turn + 1).padStart(2, "0")}</span>
        <span className="location"><small>Сектор</small><strong>{node.label}</strong></span>
        <span className="phase"><i aria-hidden="true" />{phaseLabel}</span>
      </header>

      <section className={`combat-theatre room-context-${node.type}`} aria-label="Сканирующая область">
        <RoomBackdrop kind={node.type} seed={node.id} />
        <div aria-hidden="true" className="pixel-theatre-seal">
          <span />
          <span />
          <span />
        </div>
        <div className="scanner-telemetry">
          <span>Сканер // контактов {activeEnemyCount}</span>
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
                  <span>CONTACT // TRACKED</span>
                </div>
                <div className="enemy-sprite-frame">
                  <EnemySprite enemyId={enemy.enemyId} hp={enemy.hp} />
                </div>
                <div className="enemy-name">{enemy.name}</div>
                {intent ? (
                  <div className="enemy-intent" title="Намерение противника на следующий ход">
                    <small>След. действие</small>
                    <span>{intent.icon} {intent.text}</span>
                  </div>
                ) : null}
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
            <div className="player-avatar-frame">
              <PlayerSprite />
              <span aria-hidden="true">DIVR</span>
            </div>
            <div className="player-status">
              <div className="vital vital-hp">
                <span className="vital-label"><HullIcon /> Корпус</span>
                <strong>{combat.player.hp}<small>/{combat.player.maxHp}</small></strong>
                <span className="vital-track"><i style={{ width: `${playerHpPercent}%` }} /></span>
              </div>
              <div className="vital vital-shield">
                <span className="vital-label"><ShieldIcon /> Щит</span>
                <strong>{combat.player.shield}</strong>
                <ShieldIcon className="vital-icon" />
              </div>
              <div className="vital vital-energy">
                <span className="vital-label"><EnergyIcon /> Заряд</span>
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

        {combat.injectors.length > 0 && (
          <section className="consumable-bay" aria-label="Одноразовые инъекторы">
            <div className="consumable-bay-heading">
              <InjectorIcon className="consumable-bay-icon" />
              <span><small>AUX // ONE-SHOT</small><strong>Инъекторы</strong></span>
              <em>{combat.injectors.length}</em>
            </div>
            <div className="injector-rack">
              {combat.injectors.map((injectorId, i) => {
                const injector = getInjectorById(injectorId);
                return (
                  <button
                    key={`${injectorId}-${i}`}
                    type="button"
                    aria-label={`Использовать одноразовый инъектор: ${injector.name}. ${injector.description}`}
                    aria-pressed={combat.selectedInjectorIndex === i}
                    className={`injector ${combat.selectedInjectorIndex === i ? "selected" : ""}`}
                    onClick={() => send({ type: "SELECT_INJECTOR", index: i })}
                    disabled={!isPlayerTurn}
                    title={`${injector.name} — ${injector.description}`}
                  >
                    <span className="injector-code">INJ-{String(i + 1).padStart(2, "0")}</span>
                    <span className="injector-icon-stack">
                      <InjectorIcon className="injector-icon injector-icon-line" />
                      <PixelInjectorGlyph className="injector-icon injector-icon-pixel" kind={injectorGlyphKind(injectorId)} />
                    </span>
                    <span className="injector-copy">
                      <strong>{injector.name}</strong>
                      <small>{injector.description}</small>
                    </span>
                    <span className="single-use">1×</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="console-heading">
          <span><small>Контур управления</small>Протоколы · {combat.hand.length}</span>
          <div className="console-tools">
            <span
              className="deck-readout"
              aria-label={`В колоде ${combat.drawPile.length}, в сбросе ${combat.discardPile.length}`}
              title={`Колода: ${combat.drawPile.length} · Сброс: ${combat.discardPile.length}`}
            >
              <span><DrawIcon /><small>Колода</small><strong key={`draw-${combat.drawPile.length}`}>{combat.drawPile.length}</strong></span>
              <span><DiscardIcon /><small>Сброс</small><strong key={`discard-${combat.discardPile.length}`}>{combat.discardPile.length}</strong></span>
            </span>
            <span className={`console-mode${targetingActive ? " targeting" : ""}`}>
              {targetingActive ? "Выбери цель в секторе" : "Готов к вводу"}
            </span>
            <EffectLegend />
          </div>
        </div>

        <div className="hand-row">
          {combat.hand.map((cardId, i) => {
            const card = getCardById(cardId);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={combat.selectedHandIndex === i}
                aria-describedby={`card-tooltip-${i}`}
                style={{ "--card-order": i } as CSSProperties}
                className={`card ${combat.selectedHandIndex === i ? "selected" : ""} ${
                  inspectedCardIndex === i ? "inspected" : ""
                } ${
                  getCardById(cardId).cost !== "X" && combat.player.energy < cardEffectiveCost(cardId, combat) ? "insufficient" : ""
                }`}
                onBlur={() => {
                  if (!usesTouchInspection()) setInspectedCardIndex(null);
                }}
                onClick={() => handleCardActivate(i)}
                onFocus={() => {
                  if (!usesTouchInspection()) setInspectedCardIndex(i);
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setInspectedCardIndex(i);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === "mouse") setInspectedCardIndex(null);
                }}
                disabled={!isPlayerTurn}
              >
                <div className="card-header">
                  <div className="card-index">
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <ProtocolIcon compact type={card.type} />
                  </div>
                  <div className="card-cost"><small>ЗРД</small>{card.cost}</div>
                </div>
                <div className="card-name">{card.name}</div>
                <CardEffectSummary card={card} />
                <span className="card-tooltip" id={`card-tooltip-${i}`} role="tooltip">
                  <strong>{card.name}</strong>
                  <span>{card.description}</span>
                  <small>Нажатие активирует Протокол</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="console-footer">
          <div className="selection-readout"><small>Командная строка</small><strong>{actionSummary}</strong></div>
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

      <GameMenu devTools={{ combat, send }} />
    </div>
  );
}
