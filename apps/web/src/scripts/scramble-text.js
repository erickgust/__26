import { animate, onScroll, scrambleText } from "animejs";

const initializedElements = new WeakSet();
const activeAnimations = new WeakMap();
const hoverListeners = new WeakMap();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getText(element) {
  return element.dataset.scrambleText ?? element.textContent ?? "";
}

function setVisibleText(element, text) {
  element.textContent = text;
}

function cancelAnimation(element, revert = true) {
  const animation = activeAnimations.get(element);

  if (!animation) return;

  if (revert) {
    animation.revert();
  } else {
    animation.cancel();
  }

  activeAnimations.delete(element);
}

function getAutoplay(element) {
  if (element.dataset.scrambleTrigger === "immediate") {
    return true;
  }

  return onScroll({
    target: element,
    repeat: false,
  });
}

function getInteractionTarget(element) {
  return (
    element.closest("a, button, input, select, textarea, [tabindex]") || element
  );
}

function playScramble(element, options = {}) {
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

function resetHover(element) {
  cancelAnimation(element, true);
  setVisibleText(element, getText(element));
}

function enableHover(element) {
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

function startIntroAnimation(element) {
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

function initScrambleElement(element) {
  if (initializedElements.has(element)) {
    return;
  }

  initializedElements.add(element);
  setVisibleText(element, getText(element));
  startIntroAnimation(element);
}

function initScrambleText() {
  for (const element of document.querySelectorAll("[data-scramble]")) {
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
