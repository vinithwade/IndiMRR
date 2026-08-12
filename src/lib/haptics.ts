/**
 * Best-effort selection haptic for dials / pickers.
 *
 * - Android / some Chromium mobile: Vibration API
 * - iOS Safari 17.4+: invisible `switch` checkbox toggle (system haptic)
 * - Desktop trackpads: browsers cannot drive Force Touch / Windows haptics,
 *   so we play a tiny click as sensory feedback
 */

let audioCtx: AudioContext | null = null;
let switchEl: HTMLInputElement | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function ensureIosSwitch() {
  if (typeof document === "undefined") return null;
  if (switchEl && document.body.contains(switchEl)) return switchEl;

  const input = document.createElement("input");
  input.type = "checkbox";
  // Safari 17.4+ switch control — toggling fires a system haptic
  input.setAttribute("switch", "");
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;
  Object.assign(input.style, {
    position: "fixed",
    left: "-100px",
    top: "0",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
    margin: "0",
  });
  document.body.appendChild(input);
  switchEl = input;
  return input;
}

function tickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume if suspended (required after user gesture / scroll on some browsers)
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 180;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.03, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  osc.start(t);
  osc.stop(t + 0.035);
}

function vibratePulse() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(8);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function iosSwitchHaptic() {
  try {
    const el = ensureIosSwitch();
    if (!el) return false;
    // Only meaningful on Safari with switch support
    const supportsSwitch =
      typeof CSS !== "undefined" &&
      (CSS.supports("appearance", "auto") || true);
    if (!supportsSwitch) return false;
    el.checked = !el.checked;
    // Dispatch input for good measure
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  } catch {
    return false;
  }
}

/** Fire a light "tick" when the dial selection changes. */
export function selectionHaptic() {
  if (typeof window === "undefined") return;

  // iPhone / iPad: Safari switch control haptic (17.4+)
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) {
    iosSwitchHaptic();
    return;
  }

  // Android / devices with a vibration motor
  if (vibratePulse()) return;

  // Mac / Windows trackpads cannot be vibrated from the web — soft click instead
  tickSound();
}
