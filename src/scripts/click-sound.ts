import { playSound } from "../lib/sound-engine";
import { clickSoftSound } from "../lib/soundcn/sounds/click-soft";

const CLICK_SOUND_SELECTOR = [
  "a[href]",
  "button",
  "summary",
  '[role="button"]',
  "[data-click-sound]",
].join(", ");

const INITIALIZED_FLAG = "__26ClickSoundInitialized";

declare global {
  interface Window {
    [INITIALIZED_FLAG]?: boolean;
  }
}

function isDisabled(element: Element): boolean {
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLOptGroupElement ||
    element instanceof HTMLOptionElement ||
    element instanceof HTMLFieldSetElement
  ) {
    return element.disabled;
  }

  return (
    element.getAttribute("aria-disabled") === "true" ||
    element.getAttribute("data-click-sound") === "off"
  );
}

function getInteractiveTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest(CLICK_SOUND_SELECTOR);
}

function playClickSound(): void {
  void playSound(clickSoftSound.dataUri, {
    volume: 0.23,
  }).catch(() => {
    // Ignore playback errors caused by browser policies or interrupted navigation.
  });
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || event.defaultPrevented) {
    return;
  }

  const interactiveTarget = getInteractiveTarget(event.target);
  if (!interactiveTarget || isDisabled(interactiveTarget)) {
    return;
  }

  playClickSound();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.defaultPrevented || (event.key !== "Enter" && event.key !== " ")) {
    return;
  }

  const interactiveTarget = getInteractiveTarget(event.target);
  if (!interactiveTarget || isDisabled(interactiveTarget)) {
    return;
  }

  if (event.key === " " && interactiveTarget.matches("a[href]")) {
    return;
  }

  playClickSound();
}

function initClickSound(): void {
  if (window[INITIALIZED_FLAG]) {
    return;
  }

  window[INITIALIZED_FLAG] = true;
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initClickSound, {
    once: true,
  });
} else {
  initClickSound();
}

document.addEventListener("astro:page-load", initClickSound);
