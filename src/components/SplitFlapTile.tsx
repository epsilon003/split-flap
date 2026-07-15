import { useEffect, useRef } from "react";
import { normalizeChar } from "../engine/CharacterWheel";
import {
  cancelAndReset,
  paintStatic,
  runFlipSequence,
  runJamSequence,
  type AnimSignal,
  type TileDomRefs,
} from "../engine/Animator";
import { JAM_CHAR } from "../engine/errorState";

interface SplitFlapTileProps {
  targetChar: string;
  tileIndex: number;
  /** ms delay budget for the current board-wide update, tile picks its own jitter within it */
  waveDelayMs?: number;
}

export default function SplitFlapTile({
  targetChar,
  tileIndex,
  waveDelayMs = 0,
}: SplitFlapTileProps) {
  const staticTop = useRef<HTMLDivElement>(null);
  const staticBottom = useRef<HTMLDivElement>(null);
  const flipTop = useRef<HTMLDivElement>(null);
  const flipBottom = useRef<HTMLDivElement>(null);

  const currentChar = useRef(" ");
  const signalRef = useRef<AnimSignal>({ cancelled: false });
  const initialized = useRef(false);

  useEffect(() => {
    const refs: TileDomRefs = {
      staticTop: staticTop.current!,
      staticBottom: staticBottom.current!,
      flipTop: flipTop.current!,
      flipBottom: flipBottom.current!,
    };

    const next = normalizeChar(targetChar);

    if (!initialized.current) {
      paintStatic(refs, next);
      currentChar.current = next;
      initialized.current = true;
      return;
    }

    if (next === currentChar.current) return;

    // stop any in-flight sequence and snap this tile to a clean, known
    // state before starting the new one, so a rapid re-target mid-flip
    // can't leave stray WAAPI transforms/content behind
    signalRef.current.cancelled = true;
    cancelAndReset(refs, currentChar.current);
    const signal: AnimSignal = { cancelled: false };
    signalRef.current = signal;

    const from = currentChar.current;
    currentChar.current = next;

    const jitter = {
      baseDelayMs: waveDelayMs + Math.random() * 70,
      durationScale: 0.85 + Math.random() * 0.35,
      pitchJitter: Math.random() * 2 - 1,
      volumeJitter: (Math.random() * 2 - 1) * 0.08,
    };

    runFlipSequence(refs, from, next, jitter, signal);
    if(next === JAM_CHAR) {
      runJamSequence(refs, from, jitter, signal);
    } else {
      runFlipSequence(refs, from, next, jitter, signal);
    }

    return () => {
      signal.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetChar]);

  return (
    <div className="tile" data-index={tileIndex}>
      <div className="tile-half top" ref={staticTop} />
      <div className="tile-half bottom" ref={staticBottom} />
      <div className="tile-flip flip-top" ref={flipTop} />
      <div className="tile-flip flip-bottom" ref={flipBottom} />
      <div className="tile-hinge-dot" />
    </div>
  );
}
