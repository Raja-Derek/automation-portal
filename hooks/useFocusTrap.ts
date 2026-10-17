"use client";

// Hook pengunci fokus untuk modal/dialog.
// - Pindahkan fokus ke dalam dialog saat aktif.
// - Tahan Tab / Shift+Tab agar tidak keluar dari dialog.
// - Kembalikan fokus ke elemen pemicu saat dialog ditutup.

import { useEffect } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => !el.hasAttribute("aria-hidden") && el.getClientRects().length > 0);
}

// Target fokus awal: field form pertama bila ada, jika tidak elemen pertama.
function getInitialFocus(container: HTMLElement): HTMLElement {
  const field = container.querySelector<HTMLElement>(
    "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
  );
  return field ?? getFocusable(container)[0] ?? container;
}

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Pindahkan fokus ke elemen pertama bila fokus masih di luar dialog.
    if (!node.contains(document.activeElement)) {
      getInitialFocus(node).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = getFocusable(node);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (current === first || !node.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !node.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", handleKeyDown);
    return () => {
      node.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [ref, active]);
}
