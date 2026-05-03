import { animate, onScroll, scrambleText } from "animejs";

const DEFAULT_INTRO_CHARACTERS = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";
const DEFAULT_HOVER_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";
const MIN_SCRAMBLE_SPEED = 16;
const MIN_SETTLE_DURATION = 250;
const initializedElements = new WeakSet();
const activeAnimations = new WeakMap();
const hoverListeners = new WeakMap();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function parseNumber(value, fallback) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }

  return value === "" || value === "true" || value === "1";
}

function getText(element) {
  return element.dataset.scrambleText ?? element.textContent ?? "";
}

function getClassTokens(value) {
  return (value ?? "").split(/\s+/).filter(Boolean);
}

function toggleScrambledClass(element, active) {
  const method = active ? "add" : "remove";
  for (const token of getClassTokens(element.dataset.scrambleScrambledClass)) {
    element.classList[method](token);
  }
}

function setVisibleText(element, text) {
  element.textContent = text;
}

function cancelAnimation(element, revert = true) {
  const animation = activeAnimations.get(element);

  if (!animation) {
    return;
  }

  if (revert) {
    animation.revert();
  } else {
    animation.cancel();
  }

  activeAnimations.delete(element);
  toggleScrambledClass(element, false);
}

function resolveScrambleChars({
  text,
  fallback,
  characters,
  useOriginalCharsOnly = false,
}) {
  if (!useOriginalCharsOnly) {
    return characters || fallback;
  }

  const uniqueChars = Array.from(new Set(text.replace(/\s+/g, "").split(""))).join(
    "",
  );

  return uniqueChars || characters || fallback;
}

function getRevealRate(scrambleSpeed) {
  return Math.max(1, Math.round(1000 / Math.max(scrambleSpeed, MIN_SCRAMBLE_SPEED)));
}

function getIntroParams(element) {
  const text = getText(element);
  const scrambleSpeed = parseNumber(element.dataset.scrambleSpeed, 50);
  const scrambledLetterCount = parseNumber(
    element.dataset.scrambleLetterCount,
    2,
  );
  const revealRate = getRevealRate(scrambleSpeed);

  return {
    text,
    chars: resolveScrambleChars({
      text,
      characters: element.dataset.scrambleCharacters,
      fallback: DEFAULT_INTRO_CHARACTERS,
    }),
    ease: "linear",
    from: element.dataset.scrambleDirection === "right" ? "right" : "left",
    override: "",
    revealRate,
    settleRate: revealRate,
    settleDuration: Math.max(
      MIN_SETTLE_DURATION,
      scrambleSpeed * Math.max(scrambledLetterCount, 1) * 6,
    ),
  };
}

function getHoverFromDirection(direction) {
  switch (direction) {
    case "end":
      return "right";
    case "center":
      return "center";
    default:
      return "left";
  }
}

function getHoverParams(element) {
  const text = getText(element);
  const scrambleSpeed = parseNumber(element.dataset.scrambleSpeed, 50);
  const maxIterations = parseNumber(element.dataset.scrambleMaxIterations, 10);
  const sequential = parseBoolean(element.dataset.scrambleSequential);
  const revealDirection = element.dataset.scrambleHoverDirection || "start";
  const useOriginalCharsOnly = parseBoolean(
    element.dataset.scrambleUseOriginalCharsOnly,
  );
  const revealRate = getRevealRate(scrambleSpeed);

  return {
    text,
    chars: resolveScrambleChars({
      text,
      characters: element.dataset.scrambleCharacters,
      fallback: DEFAULT_HOVER_CHARACTERS,
      useOriginalCharsOnly,
    }),
    ease: "linear",
    from: sequential ? getHoverFromDirection(revealDirection) : "random",
    revealRate: sequential ? revealRate : revealRate * 2,
    settleRate: revealRate,
    settleDuration: Math.max(
      MIN_SETTLE_DURATION,
      scrambleSpeed * Math.max(sequential ? 6 : maxIterations, 1),
    ),
    duration: sequential
      ? undefined
      : Math.max(scrambleSpeed * Math.max(maxIterations, 1), scrambleSpeed * 4),
  };
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
    element.closest("a, button, input, select, textarea, [tabindex]") ||
    element
  );
}

function resetHover(element) {
  cancelAnimation(element, true);
  setVisibleText(element, getText(element));
}

function startHoverAnimation(element) {
  const text = getText(element);

  cancelAnimation(element, true);
  setVisibleText(element, text);

  const animation = animate(element, {
    innerHTML: scrambleText(getHoverParams(element)),
    onBegin: () => {
      toggleScrambledClass(element, true);
    },
    onComplete: () => {
      activeAnimations.delete(element);
      toggleScrambledClass(element, false);
      setVisibleText(element, text);
    },
  });

  activeAnimations.set(element, animation);
}

function enableHover(element) {
  if (hoverListeners.has(element) || prefersReducedMotion()) {
    return;
  }

  const target = getInteractionTarget(element);
  const start = () => startHoverAnimation(element);
  const reset = () => resetHover(element);

  target.addEventListener("mouseenter", start);
  target.addEventListener("mouseleave", reset);
  target.addEventListener("focus", start);
  target.addEventListener("blur", reset);

  hoverListeners.set(element, {
    target,
    start,
    reset,
  });
}

function startIntroAnimation(element) {
  const text = getText(element);

  cancelAnimation(element, true);
  setVisibleText(element, "");

  if (prefersReducedMotion()) {
    setVisibleText(element, text);
    return;
  }

  const animation = animate(element, {
    autoplay: getAutoplay(element),
    innerHTML: scrambleText(getIntroParams(element)),
    onBegin: () => {
      toggleScrambledClass(element, true);
    },
    onComplete: () => {
      activeAnimations.delete(element);
      toggleScrambledClass(element, false);
      setVisibleText(element, text);

      if (element.dataset.scrambleMode === "intro-hover") {
        enableHover(element);
      }
    },
  });

  activeAnimations.set(element, animation);
}

function initScrambleElement(element) {
  if (initializedElements.has(element)) {
    return;
  }

  initializedElements.add(element);
  setVisibleText(element, getText(element));

  if (element.dataset.scrambleMode === "hover") {
    enableHover(element);
    return;
  }

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
