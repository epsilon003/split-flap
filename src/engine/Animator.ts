import { charAt, forwardPath, isColorTile, wheelIndex, CHARACTER_WHEEL } from "./CharacterWheel";
import { soundEngine } from "./SoundEngine";

export interface TileDomRefs {
  staticTop: HTMLElement;
  staticBottom: HTMLElement;
  flipTop: HTMLElement;
  flipBottom: HTMLElement;
}

export interface FlapJitter {
  /** ms, added before this tile's whole sequence begins (the "wave" effect) */
  baseDelayMs: number;
  /** multiplier applied to each step's duration, ~0.85–1.2 */
  durationScale: number;
  /** -1..1, shifts synthesized tick pitch */
  pitchJitter: number;
  /** -1..1, shifts synthesized tick volume */
  volumeJitter: number;
}

const COLOR_HEX: Record<string, string> = {
  "#red": "#c8362a",
  "#orange": "#d97a2b",
  "#yellow": "#e0b62c",
  "#green": "#3f7d4a",
  "#blue": "#2a5ca8",
  "#violet": "#6a3f8f",
  "#white": "#e9e6de",
  "#black": "#1c1c1c",
};

function renderInto(el: HTMLElement, char: string) {
  el.innerHTML = "";
  if (isColorTile(char)) {
    const swatch = document.createElement("div");
    swatch.className = "glyph-swatch";
    swatch.style.background = COLOR_HEX[char] ?? "#333";
    el.appendChild(swatch);
  } else {
    const span = document.createElement("span");
    span.className = "glyph-text";
    span.textContent = char === " " ? "" : char;
    el.appendChild(span);
  }
}

function setHalfContent(refs: TileDomRefs, char: string) {
  renderInto(refs.staticTop, char);
  renderInto(refs.staticBottom, char);
}

/** Runs a single fold: current char folding away to reveal `toChar`. */
function animateSingleStep(
  refs: TileDomRefs,
  toChar: string,
  stepDurationMs: number,
  isFinal: boolean
): Promise<void> {
  return new Promise((resolve) => {
    const half = stepDurationMs / 2;

    renderInto(refs.flipTop, "" as string); // placeholder, set below
    // flipTop shows the char that's currently resting (about to fold away)
    // it already has correct content from the previous step / initial paint
    renderInto(refs.flipBottom, toChar);

    const topAnim = refs.flipTop.animate(
      [
        { transform: "rotateX(0deg)" },
        { transform: "rotateX(-90deg)" },
      ],
      { duration: half, easing: "cubic-bezier(.55,0,1,.45)", fill: "forwards" }
    );

    topAnim.onfinish = () => {
      // reveal destination on the static back-layer now that top flap is edge-on
      setHalfContent(refs, toChar);

      const bottomKeyframes = isFinal
        ? [
            { transform: "rotateX(90deg)" },
            { transform: "rotateX(-8deg)", offset: 0.82 },
            { transform: "rotateX(0deg)" },
          ]
        : [{ transform: "rotateX(90deg)" }, { transform: "rotateX(0deg)" }];

      const bottomAnim = refs.flipBottom.animate(bottomKeyframes, {
        duration: isFinal ? half * 1.35 : half,
        easing: isFinal ? "cubic-bezier(.2,.9,.3,1.1)" : "cubic-bezier(0,.55,.45,1)",
        fill: "forwards",
      });

      bottomAnim.onfinish = () => {
        // reset transforms/content for next step
        refs.flipTop.getAnimations().forEach((a) => a.cancel());
        refs.flipBottom.getAnimations().forEach((a) => a.cancel());
        renderInto(refs.flipTop, toChar);
        resolve();
      };
    };
  });
}

export interface AnimSignal {
  cancelled: boolean;
}

/**
 * Steps a tile through every wheel position between its current character
 * and the target, playing a tick sound per step. Resolves once settled on
 * `toChar`. If `signal.cancelled` becomes true mid-flight, stops early.
 *
 * Intermediate steps share a fixed total time budget rather than each
 * getting a flat duration — otherwise a tile that has to travel nearly the
 * full character wheel (e.g. blank to a late color tile) could take
 * several seconds to settle, which reads as broken rather than mechanical.
 */
const INTERMEDIATE_BUDGET_MS = 520;

export async function runFlipSequence(
  refs: TileDomRefs,
  fromChar: string,
  toChar: string,
  jitter: FlapJitter,
  signal: AnimSignal
): Promise<void> {
  const path = forwardPath(fromChar, toChar);
  if (path.length === 0) return;

  if (jitter.baseDelayMs > 0) {
    await sleep(jitter.baseDelayMs);
  }
  if (signal.cancelled) return;

  // prime flip-top with the starting glyph before the first fold
  renderInto(refs.flipTop, fromChar);

  const intermediateCount = Math.max(0, path.length - 1);
  const perStepCap =
    intermediateCount > 0
      ? Math.max(6, INTERMEDIATE_BUDGET_MS / intermediateCount)
      : 28;

  for (let i = 0; i < path.length; i++) {
    if (signal.cancelled) return;
    const isFinal = i === path.length - 1;
    const char = charAt(path[i]);
    const baseDuration = isFinal
      ? 104
      : Math.min(22 + Math.random() * 11, perStepCap);
    const duration = Math.max(6, baseDuration * jitter.durationScale);

    soundEngine.tick(jitter.pitchJitter, jitter.volumeJitter);
    await animateSingleStep(refs, char, duration, isFinal);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function paintStatic(refs: TileDomRefs, char: string) {
  setHalfContent(refs, char);
  renderInto(refs.flipTop, char);
  renderInto(refs.flipBottom, char);
}

/**
 * Immediately halts any in-flight flap animations on this tile and repaints
 * it to a clean, consistent resting state. Must be called synchronously
 * before starting a new sequence on a tile that might already be mid-flip —
 * `.cancel()` stops the WAAPI animation without firing its finish handler,
 * so the previous `runFlipSequence` call's in-flight step simply stops
 * mutating the DOM instead of racing the new one.
 */
export function cancelAndReset(refs: TileDomRefs, char: string) {
  refs.flipTop.getAnimations().forEach((a) => a.cancel());
  refs.flipBottom.getAnimations().forEach((a) => a.cancel());
  paintStatic(refs, char);
}

function jamFinalStep(refs: TileDomRefs, stuckChar: string): Promise<void> {
  return new Promise((resolve) => {
    renderInto(refs.flipBottom, stuckChar);
    const bottomAnim = refs.flipBottom.animate(
      [{ transform: "rotateX(90deg)" }, { transform: "rotateX(0deg)" }],
      { duration: 70, easing: "ease-out", fill: "forwards" }
    );
    bottomAnim.onfinish = () => {
      const topAnim = refs.flipTop.animate(
        [{ transform: "rotateX(0deg)" }, { transform: "rotateX(-52deg)" }],
        { duration: 90, easing: "cubic-bezier(.4,0,.7,.3)", fill: "forwards" }
      );
      topAnim.onfinish = () => resolve();
    };
  });
}

/**
 * Runs a couple of ordinary-looking flip steps (as if the tile is trying
 * to reach a real character) then deliberately jams: the top flap freezes
 * mid-fold and the bottom flap settles on an unrelated glyph, so the two
 * halves visibly disagree — the way a real stuck split-flap unit looks,
 * rather than a clean error message.
 */
export async function runJamSequence(
  refs: TileDomRefs,
  fromChar: string,
  jitter: FlapJitter,
  signal: AnimSignal
): Promise<void> {
  if (jitter.baseDelayMs > 0) await sleep(jitter.baseDelayMs);
  if (signal.cancelled) return;

  renderInto(refs.flipTop, fromChar);

  let current = fromChar;
  const preSteps = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < preSteps; i++) {
    if (signal.cancelled) return;
    const next = charAt(wheelIndex(current) + 1);
    soundEngine.tick(jitter.pitchJitter, jitter.volumeJitter);
    await animateSingleStep(refs, next, 30 * jitter.durationScale, false);
    current = next;
  }

  if (signal.cancelled) return;
  const stuckChar = charAt(Math.floor(Math.random() * (CHARACTER_WHEEL.length - 1)) + 1);
  soundEngine.tick(jitter.pitchJitter * 1.4, Math.min(0.5, jitter.volumeJitter + 0.05));
  await jamFinalStep(refs, stuckChar);
}