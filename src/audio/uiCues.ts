type CueKind = "success" | "warning" | "damage" | "system";

const CUE_SETTINGS_KEY = "drift-ui-cues-enabled";

function uiCuesEnabled(): boolean {
  const value = window.localStorage.getItem(CUE_SETTINGS_KEY);
  return value !== "0";
}

export function playUiCue(kind: CueKind) {
  if (!uiCuesEnabled()) return;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequencies: Record<CueKind, number> = {
    success: 720,
    warning: 520,
    damage: 210,
    system: 420,
  };
  oscillator.type = kind === "damage" ? "sawtooth" : "square";
  oscillator.frequency.value = frequencies[kind];
  gain.gain.value = 0.02;
  oscillator.connect(gain).connect(context.destination);
  const now = context.currentTime;
  oscillator.start(now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
  oscillator.stop(now + 0.09);
  window.setTimeout(() => {
    context.close();
  }, 140);
}
