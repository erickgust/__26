import { animate, onScroll, scrambleText } from "animejs";

type ScrambleElement = HTMLElement;
type ScrambleAnimation = ReturnType<typeof animate>;
type ScrambleAutoplay = true | ReturnType<typeof onScroll>;
type ScrambleTextParams = Parameters<typeof scrambleText>[0];

type HoverListenerState = {
  target: HTMLElement;
  start: () => void;
  reset: () => void;
};

type PlayScrambleOptions = {
  autoplay?: ScrambleAutoplay;
  params?: Partial<ScrambleTextParams>;
  onComplete?: () => void;
};

const initializedElements = new WeakSet<ScrambleElement>();
const activeAnimations = new WeakMap<ScrambleElement, ScrambleAnimation>();
const hoverListeners = new WeakMap<ScrambleElement, HoverListenerState>();

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getText(element: ScrambleElement): string {
  return element.dataset.scrambleText ?? element.textContent ?? "";
}

function setVisibleText(element: ScrambleElement, text: string): void {
  element.textContent = text;
}

function cancelAnimation(element: ScrambleElement, revert = true): void {
  const animation = activeAnimations.get(element);

  if (!animation) return;

  if (revert) {
    animation.revert();
  } else {
    animation.cancel();
  }

  activeAnimations.delete(element);
}

function getAutoplay(element: ScrambleElement): ScrambleAutoplay {
  if (element.dataset.scrambleTrigger === "immediate") {
    return true;
  }

  return onScroll({
    target: element,
    repeat: false,
  });
}

function getInteractionTarget(element: ScrambleElement): HTMLElement {
  return element.closest<HTMLElement>("a, button, input, select, textarea, [tabindex]") ?? element;
}

function playScramble(element: ScrambleElement, options: PlayScrambleOptions = {}): void {
  const text = getText(element);

  cancelAnimation(element, true);

  const animation = animate(element, {
    autoplay: options.autoplay ?? true,
    innerHTML: scrambleText({
      text,
      revealRate: 36,
      ...options.params,
    }),
    onComplete: () => {
      activeAnimations.delete(element);
      setVisibleText(element, text);
      options.onComplete?.();
    },
  });

  activeAnimations.set(element, animation);
}

function resetHover(element: ScrambleElement): void {
  cancelAnimation(element, true);
  setVisibleText(element, getText(element));
}

function enableHover(element: ScrambleElement): void {
  if (hoverListeners.has(element) || prefersReducedMotion()) {
    return;
  }

  const target = getInteractionTarget(element);
  const start = () => playScramble(element);
  const reset = () => resetHover(element);

  target.addEventListener("mouseenter", start);
  target.addEventListener("mouseleave", reset);
  target.addEventListener("focus", start);
  target.addEventListener("blur", reset);

  hoverListeners.set(element, { target, start, reset });
}

function startIntroAnimation(element: ScrambleElement): void {
  if (prefersReducedMotion()) {
    setVisibleText(element, getText(element));
    return;
  }

  playScramble(element, {
    autoplay: getAutoplay(element),
    params: {
      override: "",
    },
    onComplete: () => {
      if (element.dataset.scrambleMode === "intro-hover") {
        enableHover(element);
      }
    },
  });
}

function initScrambleElement(element: ScrambleElement): void {
  if (initializedElements.has(element)) {
    return;
  }

  initializedElements.add(element);
  setVisibleText(element, getText(element));
  startIntroAnimation(element);
}

function initScrambleText(): void {
  for (const element of document.querySelectorAll<HTMLElement>("[data-scramble]")) {
    initScrambleElement(element);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrambleText, {
    once: true,
  });
} else {
  initScrambleText();
}

document.addEventListener("astro:page-load", initScrambleText);
