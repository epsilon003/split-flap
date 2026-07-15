import { useEffect, useRef } from "react";
import type { Align } from "../types";
import { BOARD_COLS } from "../engine/boardConfig";

interface TypingParams {
  active: boolean;
  onUpdate: (lines: string[], align: Align) => void;
  /** called when the user presses Escape, so the parent can resume rotation */
  onExit?: () => void;
}

const ALLOWED = /^[A-Za-z0-9 !@#$%&*()\-+=:;'",.?/]$/;
const MAX_LEN = BOARD_COLS - 2;

/** Mimics the omnibox: a bare domain or URL navigates directly rather than
 * being searched for. Deliberately conservative — only fires for
 * unambiguous, single-token URL-shaped input. */
function resolveUrl(query: string): string {
  const trimmed = query.trim();
  const looksLikeUrl =
    !trimmed.includes(" ") &&
    (/^https?:\/\//i.test(trimmed) ||
      /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?$/i.test(trimmed));

  if (looksLikeUrl) {
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

/**
 * Treats the board like an omnibox: typed text renders live on the board,
 * Enter runs it as a Google search (navigates the tab, same as typing into
 * the real address bar), Escape cancels back to rotation.
 */
export function useTypingModule({ active, onUpdate, onExit }: TypingParams) {
  const buffer = useRef("");

  useEffect(() => {
    if (!active) return;
    buffer.current = "";

    const render = () => {
      onUpdate(["SEARCH OR GO TO", `${buffer.current}_`], "center");
    };
    render();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit?.();
        return;
      }
      if (e.key === "Enter") {
        const query = buffer.current.trim();
        if (query) {
          window.location.href = resolveUrl(query);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "Backspace") {
        buffer.current = buffer.current.slice(0, -1);
        render();
        e.preventDefault();
        return;
      }
      if (e.key.length === 1 && ALLOWED.test(e.key)) {
        if (buffer.current.length < MAX_LEN) {
          buffer.current += e.key;
          render();
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onUpdate, onExit]);
}
