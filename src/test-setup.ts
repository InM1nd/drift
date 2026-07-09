// idb-keyval (используется в runStore.ts для сохранения захода) требует
// IndexedDB, которой нет в среде vitest по умолчанию (Node) — полифилим.
import "fake-indexeddb/auto";
