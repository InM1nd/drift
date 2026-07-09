[← Индекс](00-index.md)

# 07 · Архитектура (Vite + React + PWA)

## Стек

- **Vite + React + TypeScript** — чистый SPA, без Next.js: игре не нужен SSR, только клиентский рендер и офлайн-работа.
- **Состояние боя:** XState — фазы хода как явный автомат (`playerTurn → resolving → enemyTurn → combatEnd`), удобно отлаживать и невозможно попасть в невалидное состояние.
- **Состояние захода:** Zustand (или React Context) — колода, Модули, Инъекторы, HP, кредиты поверх машины боя.
- **Рендер:** DOM/CSS — пиксель-арт через `image-rendering: pixelated`, Framer Motion для твинов карт, hover и layout-переходов. Canvas/PixiJS — только если позже реально понадобится тяжёлая частичная графика.
- **PWA:** `vite-plugin-pwa` — манифест (иконки, `display: standalone`), service worker кеширует шелл приложения для офлайн-игры, промпт «Установить приложение».

## Модель данных карты

Согласована со списком карт в [03 · Карты](03-cards.md) — 7 атомарных эффектов, включая динамические значения и триггеры Power, а не только фиксированные числа.

```ts
interface CardData {
  id: string;
  name: string;
  cost: number | "X";              // "X" = весь доступный Заряд
  type: "attack" | "skill" | "power";
  tags: string[];
  exhaust?: boolean;
  retain?: boolean;
  trigger?: "onTurnStart" | "onTurnEnd" | "onCardPlayed" | "onAttacked";
  effects: Effect[];
}

type Target = "enemy" | "self" | "allEnemies";

type Amount =
  | number
  | { ref: "shield" | "corrosionOnTarget" | "cardsPlayedThisTurn" | "energySpent"; mult?: number };

type Effect =
  | { kind: "damage"; amount: Amount; target: Target }
  | { kind: "block"; amount: Amount }
  | { kind: "heal"; amount: Amount }
  | { kind: "gainEnergy"; amount: Amount }
  | { kind: "applyStatus"; status: Status; stacks: Amount; target: Target }
  | { kind: "draw"; count: Amount }
  | { kind: "reduceNextCardCost"; amount: number };
```

Три показательных примера — простая карта, динамическое значение, триггер Power:

```ts
const strike: CardData = {
  id: "strike", name: "Залп", cost: 1, type: "attack", tags: ["basic"],
  effects: [{ kind: "damage", amount: 6, target: "enemy" }],
};

const decayFinisher: CardData = {
  id: "decay-finisher", name: "Финал распада", cost: 2, type: "attack",
  tags: ["corrosion"], exhaust: true,
  effects: [{ kind: "damage", amount: { ref: "corrosionOnTarget", mult: 2 }, target: "enemy" }],
};

const decayCatalyst: CardData = {
  id: "decay-catalyst", name: "Катализатор распада", cost: 2, type: "power",
  tags: ["corrosion"], trigger: "onTurnStart",
  effects: [{ kind: "applyStatus", status: "corrosion", stacks: 1, target: "allEnemies" }],
};
```

Простые карты — чистые данные без специальной логики резолвера; карты со scaling-значением или триггером используют `Amount`-объект/`trigger`, но остаются декларативными записями, а не кодом. Резолвер (как именно `ref` превращается в число, как обрабатывается очередь триггеров) — отдельная задача реализации, не предмет этого документа.

Враг описывается параллельной декларативной структурой — поля `hp` / `moveset` / `pattern`, см. [04 · Враги](04-enemies.md).

## Детерминизм и сохранение посреди боя — обязательное требование мобилки

Это не полировка, а table stakes: телефонную сессию постоянно прерывают в середине боя, и «продолжить точно с того же места» — базовое ожидание. Точное восстановление требует, чтобы вся случайность была детерминированной и сериализуемой вместе с остальным состоянием.

- **Сидированный PRNG вместо `Math.random()`:** вся случайность (замес колоды, дропы, ходы врага) идёт через один генератор с сохраняемой позицией курсора. Это же даёт воспроизводимость сида для реиграбельности.
- **Всё состояние боя — сериализуемый снапшот:** рука, колода, сброс, изгнание, статусы, intent врага и позиция RNG сохраняются в IndexedDB как один объект, из которого бой восстанавливается байт-в-байт.
- **Ловушка XState:** в context машины не должно быть замыканий/функций — только сериализуемые данные, иначе снапшот нельзя сохранить и регидрировать. Логику держим в actions/guards, а не в самом состоянии.

## Сохранения

IndexedDB (например, через `idb-keyval`) — прогресс захода хранится локально, бэкенд не нужен.

## Dev-инструменты

Отдельная отладочная панель (только в dev-сборке) — стартовать любой бой, задать HP, выдать Протоколы/Модули/Инъекторы, зафиксировать сид. Без неё сбалансировать декбилдер вручную практически невозможно — строим её рано, а не в конце.

---
Далее: [08 · Роадмап →](08-roadmap.md)
