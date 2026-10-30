"use client";

let revealed = false;
const listeners = new Set<() => void>();

/** Runs `callback` when the page is uncovered: immediately if the intro is over or was skipped. */
export function onReveal(callback: () => void) {
  if (revealed) {
    callback();
    return () => {};
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function reveal() {
  if (revealed) return;
  revealed = true;
  listeners.forEach((callback) => callback());
  listeners.clear();
}
