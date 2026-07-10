import type { CSSProperties, ReactNode } from "react";
import type { CombatState, EnemyCombatantState } from "../../engine/combatState";
import { getCardById } from "../../data/cards";
import { getInjectorById } from "../../data/injectors";
import { CardEffectSummary, EffectLegend } from "../CardEffectSummary";
import { EnemySprite, PlayerSprite } from "../CombatSprite";
import { RoomBackdrop } from "../RoomBackdrop";
import { ProtocolIcon } from "../ProtocolIcon";
import { StatusChips } from "../StatusChips";
import type { HudRoomKind } from "../HudRoomBackdrop";
import {
  DiscardIcon,
  DrawIcon,
  InjectorIcon,
  PixelInjectorGlyph,
  ShieldIcon,
  type PixelInjectorKind,
} from "../icons";
import { PixelMedallion, PixelMeter, PixelPanel } from "./PixelChrome";
import "./PixelLayout.css";

interface PixelCombatLayoutProps {
  nodeLabel: string;
  nodeType: HudRoomKind;
  nodeSeed: string;
  phaseLabel: string;
  stateValue: string;
  combat: CombatState;
  isPlayerTurn: boolean;
  targetingActive: boolean;
  lowHull: boolean;
  selectedAction: string;
  combatNotice: { text: string; kind: "system" | "warning" | "damage" } | null;
  inspectedCardIndex: number | null;
  onResolve: () => void;
  onTargetEnemy: (index: number) => void;
  onSelectInjector: (index: number) => void;
  onCardActivate: (index: number) => void;
  onCardFocus: (index: number) => void;
  onCardBlur: () => void;
  onCardMouseEnter: (index: number) => void;
  onCardMouseLeave: () => void;
  onEndTurn: () => void;
  cardEffectiveCost: (cardId: string, combat: CombatState) => number;
  intentForEnemy: (enemy: EnemyCombatantState, combat: CombatState) => { icon: ReactNode; text: ReactNode } | null;
  injectorGlyphKind: (id: string) => PixelInjectorKind;
}

export function PixelCombatLayout({
  nodeLabel,
  nodeType,
  nodeSeed,
  phaseLabel,
  stateValue,
  combat,
  isPlayerTurn,
  targetingActive,
  lowHull,
  selectedAction,
  combatNotice,
  inspectedCardIndex,
  onResolve,
  onTargetEnemy,
  onSelectInjector,
  onCardActivate,
  onCardFocus,
  onCardBlur,
  onCardMouseEnter,
  onCardMouseLeave,
  onEndTurn,
  cardEffectiveCost,
  intentForEnemy,
  injectorGlyphKind,
}: PixelCombatLayoutProps) {
  const activeEnemyCount = combat.enemies.filter((enemy) => enemy.hp > 0).length;
  const targetingText = targetingActive ? `Цель для: ${selectedAction}` : selectedAction;

  return (
    <div className={`combat-screen pixel-combat-screen${lowHull ? " low-hull" : ""}`}>
      <header className="pixel-combat-header pixel-panel">
        <PixelMedallion>Ход {String(combat.turn + 1).padStart(2, "0")}</PixelMedallion>
        <span className="pixel-combat-sector">{nodeLabel}</span>
        <PixelMedallion className="pixel-combat-phase">{phaseLabel}</PixelMedallion>
      </header>

      <section className={`pixel-combat-stage room-context-${nodeType}`} aria-label="Алтарная сцена">
        <RoomBackdrop kind={nodeType} seed={nodeSeed} />
        <div aria-hidden="true" className="pixel-stage-seal">
          <span />
          <span />
          <span />
        </div>
        <span className="pixel-stage-kicker">Контактов: {activeEnemyCount}</span>

        <div className={`pixel-enemy-grid${targetingActive ? " targeting" : ""}`}>
          {combat.enemies.map((enemy, index) => {
            const intent = intentForEnemy(enemy, combat);
            const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
            const isTargeted = combat.targetEnemyIndex === index;
            const isDead = enemy.hp <= 0;
            return (
              <button
                aria-pressed={isTargeted}
                className={`pixel-enemy-card${isTargeted ? " targeted" : ""}${isDead ? " dead" : ""}`}
                disabled={isDead || !isPlayerTurn}
                key={`${enemy.enemyId}-${index}`}
                onClick={() => onTargetEnemy(index)}
                type="button"
              >
                <PixelMedallion className="pixel-enemy-index">#{String(index + 1).padStart(2, "0")}</PixelMedallion>
                <div className="pixel-enemy-sprite-wrap">
                  <EnemySprite enemyId={enemy.enemyId} hp={enemy.hp} />
                </div>
                <div className="enemy-name">{enemy.name}</div>
                {intent ? (
                  <div className="pixel-enemy-intent">
                    <small>Следующий ход</small>
                    <span>
                      {intent.icon}
                      {intent.text}
                    </span>
                  </div>
                ) : null}
                <div className="hp-bar">
                  <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
                </div>
                <div className="pixel-enemy-values">
                  <span>{Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
                  {enemy.shield > 0 ? (
                    <span>
                      <ShieldIcon className="inline-icon" /> {enemy.shield}
                    </span>
                  ) : null}
                </div>
                <StatusChips statuses={enemy.statuses} />
              </button>
            );
          })}
        </div>

        {combatNotice ? <div className={`combat-notice ${combatNotice.kind}`}>{combatNotice.text}</div> : null}
      </section>

      <section className="pixel-cockpit" aria-label="Нижняя консоль">
        <PixelPanel className="pixel-player-panel">
          <div className="pixel-player-avatar">
            <PlayerSprite />
            <span>DIVR</span>
          </div>
          <div className="pixel-player-vitals">
            <PixelMeter label="Корпус" max={combat.player.maxHp} tone={lowHull ? "danger" : "accent"} value={combat.player.hp} />
            <PixelMeter label="Щит" max={Math.max(1, combat.player.shield || 1)} tone="stabilization" value={combat.player.shield} />
            <PixelMeter label="Заряд" max={combat.player.maxEnergy} tone="energy" value={combat.player.energy} />
          </div>
          <StatusChips statuses={combat.player.statuses} />
        </PixelPanel>

        <PixelPanel className="pixel-combat-toolbar">
          <div className="pixel-toolbar-left">
            <span className="pixel-toolbar-label">Протоколы · {combat.hand.length}</span>
            <span className="deck-readout" title={`Колода: ${combat.drawPile.length} · Сброс: ${combat.discardPile.length}`}>
              <span>
                <DrawIcon />
                <small>Колода</small>
                <strong key={`draw-${combat.drawPile.length}`}>{combat.drawPile.length}</strong>
              </span>
              <span>
                <DiscardIcon />
                <small>Сброс</small>
                <strong key={`discard-${combat.discardPile.length}`}>{combat.discardPile.length}</strong>
              </span>
            </span>
          </div>
          <div className="pixel-toolbar-right">
            <span className={`console-mode${targetingActive ? " targeting" : ""}`}>{targetingText}</span>
            <EffectLegend />
          </div>
        </PixelPanel>

        {combat.injectors.length > 0 ? (
          <PixelPanel className="pixel-injector-panel">
            <div className="pixel-injector-heading">
              <InjectorIcon className="consumable-bay-icon" />
              <strong>Инъекторы</strong>
              <PixelMedallion>{combat.injectors.length}</PixelMedallion>
            </div>
            <div className="injector-rack">
              {combat.injectors.map((injectorId, index) => {
                const injector = getInjectorById(injectorId);
                return (
                  <button
                    aria-label={`Использовать одноразовый инъектор: ${injector.name}. ${injector.description}`}
                    aria-pressed={combat.selectedInjectorIndex === index}
                    className={`injector ${combat.selectedInjectorIndex === index ? "selected" : ""}`}
                    disabled={!isPlayerTurn}
                    key={`${injectorId}-${index}`}
                    onClick={() => onSelectInjector(index)}
                    type="button"
                  >
                    <span className="injector-code">INJ-{String(index + 1).padStart(2, "0")}</span>
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
          </PixelPanel>
        ) : null}

        <div className="pixel-hand-and-action">
          <div className="pixel-hand-row">
            {combat.hand.map((cardId, index) => {
              const card = getCardById(cardId);
              const isSelected = combat.selectedHandIndex === index;
              const isInsufficient = card.cost !== "X" && combat.player.energy < cardEffectiveCost(cardId, combat);
              return (
                <button
                  aria-describedby={`card-tooltip-${index}`}
                  aria-pressed={isSelected}
                  className={`card${isSelected ? " selected" : ""}${inspectedCardIndex === index ? " inspected" : ""}${
                    isInsufficient ? " insufficient" : ""
                  }`}
                  disabled={!isPlayerTurn}
                  key={`${cardId}-${index}`}
                  onBlur={onCardBlur}
                  onClick={() => onCardActivate(index)}
                  onFocus={() => onCardFocus(index)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") onCardMouseEnter(index);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") onCardMouseLeave();
                  }}
                  style={{ "--card-order": index } as CSSProperties}
                  type="button"
                >
                  <div className="card-header">
                    <div className="card-index">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <ProtocolIcon compact type={card.type} />
                    </div>
                    <div className="card-cost">
                      <small>ЗРД</small>
                      {card.cost}
                    </div>
                  </div>
                  <div className="card-name">{card.name}</div>
                  <CardEffectSummary card={card} />
                  <span className="card-tooltip" id={`card-tooltip-${index}`} role="tooltip">
                    <strong>{card.name}</strong>
                    <span>{card.description}</span>
                    <small>Нажатие активирует Протокол</small>
                  </span>
                </button>
              );
            })}
          </div>

          <button className="end-turn pixel-end-turn" disabled={!isPlayerTurn} onClick={onEndTurn} type="button">
            <span>Завершить</span> ход
          </button>
        </div>

        <PixelPanel className="pixel-battle-log">
          <span className="pixel-log-title">Журнал</span>
          <div className="log-lines">
            {combat.log.length === 0 ? <div>Канал чист // ожидание действия</div> : null}
            {combat.log.slice(-4).map((line, index) => (
              <div key={`${line}-${index}`}>{line}</div>
            ))}
          </div>
        </PixelPanel>

        {stateValue === "victory" || stateValue === "defeat" ? (
          <div className={`outcome-banner ${stateValue}`}>
            <div>{stateValue === "victory" ? "Победа" : "Поражение"}</div>
            <button className="continue-button" onClick={onResolve} type="button">
              {stateValue === "victory" ? "Продолжить →" : "Завершить забег"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
