[← Индекс](00-index.md)

# 09 · Визуальный стиль A — HUD визора

> Один из двух шорт-листнутых кандидатов (см. также [10 · Пиксельный трофей](10-style-pixel.md)). Пользователь сравнивал оба вживую на макете — этот документ фиксирует контракт для реализации, а не сам выбор между ними. Если в итоге строится только один — можно оставить как есть; если оба — см. «Как сосуществовать с кандидатом B» в конце.

## Концепция

Игрок не смотрит на игру снаружи — он смотрит **сквозь забрало экзоскелета**. Всё, что на экране, — показания бортового сенсора Ядра: моноширинный текст как в реальном HUD, врагов и Протоколы — как размеченные данные, а не иллюстрации. Никакого «арта» в классическом смысле не требуется: сама сдержанность и есть стиль. Это также самый дешёвый в реализации кандидат — 100% CSS/SVG, без пайплайна ассетов.

Три смысловых цвета вместо одного акцента (см. токены) — реальные HUD кодируют подсистемы цветом, и это прямо ложится на существующую механику: голубой — наведение/интерактив, янтарный — Заряд/предупреждение, зелёный — био (Коррозия), красный — критическое.

## Токены

Заменяют `:root` в `src/index.css`. Существующие имена (`--bg`, `--ink`, `--ink-soft`, `--accent`, `--corrosion`) стоит **оставить работающими** (переопределить их значениями ниже), чтобы не переписывать каждый `var(--accent)` по всему CSS — новые токены добавляются рядом для мест, которым нужна более точная семантика.

```css
:root {
  /* база */
  --bg: #05080b;
  --panel: rgba(13, 22, 28, 0.74);       /* стеклянная панель поверх --bg */
  --line: #1f3a44;                        /* волосяные обводки */
  --ink: #cdeaf0;
  --ink-soft: #6f97a3;

  /* три смысловых акцента вместо одного --accent */
  --accent: #3fd0ff;      /* наведение / выбор / интерактив — было --accent, значение меняется */
  --energy: #ffb454;      /* Заряд, стоимость карты, предупреждение */
  --danger: #ff5c66;      /* урон по игроку, Пробоина, defeat */

  /* статусы — см. "Статусы и иконки" ниже, применяются через уже
     существующий класс `status-${status}` (StatusChips.tsx его уже рендерит) */
  --status-corrosion: #7dffb0;
  --status-overdrive: #ffb454;     /* = --energy, форсаж это тот же "энергетический" регистр */
  --status-stabilization: #3fd0ff; /* = --accent, "прицельный" регистр */
  --status-jamming: #9b8cd9;
  --status-breach: #ff5c66;        /* = --danger */
  --status-reflect: #ff7ad1;

  --corrosion: var(--status-corrosion); /* существующая переменная — алиас, ничего не ломает */

  --sans: var(--mono);   /* HUD не использует отдельный "sans" — везде моно */
  --mono: ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", Consolas, monospace;

  --radius: 0px;          /* см. "форма панелей" — срез угла заменяет border-radius */
  --corner-cut: 8px;
  --border-w: 1px;

  color-scheme: dark;
}
```

Это **однозначно тёмная** тема — визор не бывает светлым. Светлая альтернативная тема не нужна (осознанный выбор, не упущение): не пытаться поддерживать `prefers-color-scheme: light`.

## Типографика

- Везде моноширинный шрифт (см. `--mono` выше) — включая заголовки экранов (`.screen-layout h1`), сейчас там `var(--sans)`, который фактически serif — сменить на `var(--mono)`.
- Заголовки, лейблы статус-баров, имена узлов карты — **uppercase** + `letter-spacing: 0.04em` (уже частично есть в `.outcome-banner`, распространить на `.top-bar`, `.enemy-name`, `.map-node`).
- Все числа (`HP`, `Щит`, `Заряд`, цены, стоимость карты) — `font-variant-numeric: tabular-nums`, чтобы не «прыгали» при обновлении.
- Текст описаний карт (`.card-desc`) — обычный регистр, чуть повышенный `line-height` (1.3–1.4), это единственное место, где читается длинный текст, и moноширинный шрифт в длинных строках субъективно тяжелее serif — если после реализации станет тяжело читать, единственное разрешённое исключение: `.card-desc` на `var(--sans-fallback)` (системный sans), но начать стоит с моно везде.

## Форма панелей — срезанный угол вместо скругления

Сигнатурная форма стиля: два противоположных угла среза́ны, как рамка данных на сенсорном экране. Заменяет `border-radius: 6px`, который сейчас на `.enemy`, `.card`, `.player-status`, `.reward-card`, `.shop-item`, `.rest-choice`, `.map-node`, `.primary-button`, `.injector`, `.end-turn`, `.continue-button`.

```css
.hud-panel {
  clip-path: polygon(
    var(--corner-cut) 0, 100% 0,
    100% calc(100% - var(--corner-cut)), calc(100% - var(--corner-cut)) 100%,
    0 100%, 0 var(--corner-cut)
  );
  background: var(--panel);
  border: var(--border-w) solid var(--line);
}
```

Применить этот класс (или продублировать правило под существующими селекторами) на: `.enemy`, `.card`, `.injector`, `.player-status`, `.reward-card`, `.shop-item`, `.rest-choice`, `.map-node`, `.primary-button`, `.secondary-button`, `.skip-button`, `.continue-button`, `.end-turn`, `.deck-list button`. На маленьких элементах (`.status-chip`, кнопки высотой < 32px) срез будет нечитаем — там просто `border-radius: 0` без `clip-path`, острый прямой угол.

**Важно:** `clip-path` обрезает и `box-shadow`/`outline`, в т.ч. `:focus-visible`. Проверить, что фокус-обводка клавиатуры (см. «Доступность» ниже) не обрезается срезом — либо выносить фокус-кольцо на псевдоэлемент без `clip-path`, либо использовать `filter: drop-shadow(...)` вместо `box-shadow` для состояний фокуса/выбора там, где это нужно.

## Сканлайн-оверлей

Тонкая статичная текстура поверх `.combat-screen` и `.screen-layout` (глобально, один оверлей на весь экран, не на каждую панель):

```css
.combat-screen::after,
.screen-layout::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02) 0px,
    rgba(255, 255, 255, 0.02) 1px,
    transparent 1px,
    transparent 3px
  );
  mix-blend-mode: screen;
}
```

`.combat-screen`/`.screen-layout` нужен `position: relative` для этого. Опциональная лёгкая анимация вертикального дрейфа (`background-position`) — **только** внутри `@media (prefers-reduced-motion: no-preference)`, вне этого блока сканлайн статичен.

## Статусы и иконки

`STATUS_ICONS` в `src/components/statusIcons.ts` сейчас — эмодзи-заглушки (`☣⚡🛡+📡💥↩`). Заменить на инлайн-SVG. Это требует смены типа: `Record<Status, string>` → `Record<Status, JSX.Element>` (или компонент `<StatusIcon status={...} />`), т.к. эмодзи-строку на SVG-компонент подменить без смены типа нельзя. `StatusChips.tsx` уже рендерит класс `status-${status}` на каждый чип — красить иконки/фон по статусу можно чистым CSS через `.status-corrosion svg`, `.status-overdrive svg` и т.д., используя токены `--status-*` выше.

Язык иконок: `viewBox="0 0 24 24"`, `stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`, `currentColor` берётся из цвета текста чипа (уже раскрашен через токен) — то есть каждая иконка рисуется **один раз**, а цвет приходит бесплатно из CSS.

Полностью проработанные примеры (использовать как образец языка для остальных):

- **Урон/атака** (используется в `intentFor()` в `CombatScreen.tsx` для намерения врага): `<path d="M5 19L19 5M13 5h6v6"/>` — вектор-стрелка «на вылет».
- **Щит/блок**: `<path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"/>`
- **Отражение** (`reflect`): `<path d="M9 14l-4-4 4-4M5 10h9a5 5 0 0 1 0 10h-1"/>` — изогнутая стрелка возврата.

Чек-лист остальных иконок (нарисовать в том же языке, одна иконка = одна форма, без заливки):
- `corrosion` — три малые точки в треугольнике внутри окружности (рой наносборок)
- `overdrive` — молния
- `stabilization` — тот же щит-контур + внутренний плюс
- `jamming` — две «зашумлённые»/рваные волнистые линии с диагональным разрывом
- `breach` — треснувший щит-контур (тот же контур щита с изломом на одной грани)
- Иконки узлов карты (`NODE_ICONS` в `MapScreen.tsx`, сейчас `⬡◆◈$+☠`): Отсек — шестиугольник-контур, Страж — двойной ромб, Сигнал — антенна/волна, Терминал снабжения — контур терминала/консоли, Ремонтный отсек — крест в окружности, Ядро-Страж — концентрические окружности с крестом (реакторное ядро).

## Компонент за компонентом

Файлы: `src/index.css` (токены выше), `src/components/CombatScreen.css`, `src/components/ScreenLayout.css`, `src/components/statusIcons.ts`, `src/components/CombatScreen.tsx` (`intentFor`), `src/components/MapScreen.tsx` (`NODE_ICONS`). `src/components/DevPanel.css`/`DevPanel.tsx` — **вне скоупа**, оставить нейтральным служебным видом (это dev-only инструмент, не часть игрового опыта, см. `import.meta.env.DEV`).

| Селектор | Файл | Что меняется |
|---|---|---|
| `.top-bar` | CombatScreen.css | uppercase, `letter-spacing`, тонкая нижняя линия `--line` |
| `.enemy`, `.enemy.targeted` | CombatScreen.css | `.hud-panel`; `.targeted` — рамка `--accent` + `filter: drop-shadow(0 0 4px var(--accent))` вместо `box-shadow` (см. предупреждение про `clip-path`) |
| `.enemy-intent` | CombatScreen.css + CombatScreen.tsx | цвет `--danger`, иконка вместо `⚔`/`🛡`/`➕` |
| `.hp-bar`/`.hp-fill` | CombatScreen.css | `background: var(--line)`; `.hp-fill` — `linear-gradient(90deg, var(--accent), #7defff)` |
| `.status-chip` + `.status-${status}` | CombatScreen.css | базовый чип — `.hud-panel` без среза (просто `border-radius:0`), фон `color-mix(in srgb, var(--status-X) 14%, transparent)`, текст/иконка `var(--status-X)` |
| `.player-status` | CombatScreen.css | `.hud-panel`, значения `tabular-nums` |
| `.card`, `.card.selected` | CombatScreen.css | `.hud-panel`; `.selected` — `border-color: var(--accent)` + `filter: drop-shadow(...)` вместо текущего чистого `translateY` (можно оставить лёгкий `translateY(-4px)` вместе с свечением) |
| `.card-cost` | CombatScreen.css | цвет `var(--energy)` (не `--accent`) — стоимость семантически про Заряд |
| `.injector`, `.injector.selected` | CombatScreen.css | `.hud-panel` с `border-style:dashed` → замени на сплошную рамку `var(--energy)` (пунктир не вяжется с языком HUD) |
| `.outcome-banner.victory/.defeat` | CombatScreen.css | victory → `var(--accent)`, defeat → `var(--danger)` (сейчас перепутано: victory красится в `--corrosion`, defeat в `--accent` — поправить заодно) |
| `.map-node.current/.choice/.locked` | ScreenLayout.css | `.current` — рамка `--accent`; `.locked` (силуэт нераскрытого слоя) — держать `opacity:0.3`, **не** переносить срез-угла на него, иначе будет читаться как обычный узел, а не «неизвестно» |
| `.primary-button` | ScreenLayout.css | фон `var(--accent)`, текст `var(--bg)` (уже так) — оставить как главный call-to-action цвет |
| `.credits-bar` | ScreenLayout.css | цвет `var(--energy)`, не `--accent` (кредиты — не то же самое, что «наведение», развести семантику) |

## Движение

Framer Motion уже в зависимостях (`package.json`), пока нигде не используется. Для этого стиля — по минимуму, HUD не должен «играть»:

- `.card`/`.injector` при появлении в руке — короткий fade+slide снизу (`initial={{opacity:0, y:8}}`), не пружинный bounce.
- Выбор карты/наведение цели — **не** Framer Motion, чистый CSS-переход `filter`/`border-color` (0.12–0.15s) — это состояние, не жест.
- Урон/лечение чисел — можно дать всплывающий "+N"/"-N" индикатор через Framer Motion `AnimatePresence` (взлетает и гаснет), но это отдельный, не блокирующий шаг.
- Сканлайн — CSS `@keyframes`, не Framer Motion.
- Обязательно: всё, что не chiто выше через `@media (prefers-reduced-motion: no-preference)`, должно иметь статичный fallback без анимации — HUD не должен вызывать дискомфорт при вестибулярной чувствительности.

## Доступность

- Контраст: `--ink` (#cdeaf0) на `--bg` (#05080b) — держать AA как минимум для текста описаний карт (`.card-desc` использует `--ink-soft`, проверить контраст `#6f97a3` на `#05080b`, если не проходит AA — чуть осветлить `--ink-soft`).
- `:focus-visible` обязателен на всех интерактивных `.hud-panel` — см. предупреждение про `clip-path` выше, не терять фокус-кольцо молча.
- Touch-таргеты `min-height: 44px` уже везде выставлены в текущем CSS — не понижать при реализации.

## Порядок реализации

1. **Инфраструктура переключения стиля до всего остального.** Добавить `data-visual-style="hud"` на `<html>` (или корневой контейнер), токены выше — под `:root[data-visual-style="hud"]`, а не напрямую в `:root`. Это позволяет держать оба кандидата (A и B) в одной кодовой базе одновременно и переключать для сравнения вживую, а не переписывать друг друга.
2. Токены (`src/index.css`) — раздел «Токены» выше.
3. Форма панелей (`.hud-panel` + расстановка по селекторам из таблицы) и сканлайн-оверлей.
4. Иконки: завести `src/components/icons.tsx` с SVG-компонентами, обновить `statusIcons.ts` (или заменить его использование напрямую), `intentFor()` в `CombatScreen.tsx`, `NODE_ICONS` в `MapScreen.tsx`.
5. Точечный проход по таблице «Компонент за компонентом».
6. Типографика (uppercase/tracking/tabular-nums проход по заголовкам и цифрам).
7. Движение (Framer Motion для появления карт — необязательный, но дешёвый штрих).
8. Ручная проверка на телефоне/узком вьюпорте (проект mobile-first, портретная ориентация — см. [02 · Боевая петля и мобильный UI](02-combat.md)) — срез углов и сканлайн не должны создавать горизонтальный скролл.

## Готово, когда

- [ ] Ни одного эмодзи в `statusIcons.ts`, `intentFor()`, `NODE_ICONS`.
- [ ] Ни одного `border-radius: 6px` не осталось нетронутым (либо `.hud-panel`, либо явный `radius:0`).
- [ ] Все 6 статусов визуально различимы по цвету И по форме иконки (не только по подписи текстом).
- [ ] `:focus-visible` виден на карте/враге/кнопке при табуляции с клавиатуры.
- [ ] Прогон на `prefers-reduced-motion: reduce` не показывает анимированный сканлайн и не даёт двигающихся элементов.
- [ ] `npm run dev` на портретном вьюпорте (375×812 как базовая точка) — нет горизонтального скролла.

## Как сосуществовать с кандидатом B

Если строится и [10 · Пиксельный трофей](10-style-pixel.md) — токены этого документа живут под `:root[data-visual-style="hud"]`, токены кандидата B — под `:root[data-visual-style="pixel"]`, общая структурная CSS (layout, flex/grid, отступы) не дублируется между ними, меняются только цвет/форма/шрифт через токены и несколько сигнатурных правил (`clip-path` тут, толстая обводка там). Переключатель стиля можно временно повесить в `DevPanel` (dev-only) на время сравнения.

---
Далее: [10 · Пиксельный трофей →](10-style-pixel.md)
