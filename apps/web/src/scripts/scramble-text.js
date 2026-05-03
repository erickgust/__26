import { animate, onScroll, scrambleText } from "animejs";

const initializedElements = new WeakSet();
const activeAnimations = new WeakMap();
const hoverListeners = new WeakMap();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function parseNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function parseBoolean(value) {
  if (value == null) {
    return undefined;
  }

  if (value === "true" || value === "1" || value === "") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  return undefined;
}

function parseCursor(value) {
  const booleanValue = parseBoolean(value);

  if (booleanValue !== undefined) {
    return booleanValue;
  }

  const numericValue = parseNumber(value);

  return numericValue ?? value;
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function getText(element) {
  return element.dataset.scrambleText ?? element.textContent ?? "";
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
}

function readScrambleParams(element, prefix, defaults = {}) {
  const text = getText(element);
  const charsKey = `${prefix}Chars`;
  const fromKey = `${prefix}From`;
  const durationKey = `${prefix}Duration`;
  const revealRateKey = `${prefix}RevealRate`;
  const settleRateKey = `${prefix}SettleRate`;
  const settleDurationKey = `${prefix}SettleDuration`;
  const revealDelayKey = `${prefix}RevealDelay`;
  const delayKey = `${prefix}Delay`;
  const overrideKey = `${prefix}Override`;
  const reversedKey = `${prefix}Reversed`;
  const cursorKey = `${prefix}Cursor`;
  const perturbationKey = `${prefix}Perturbation`;
  const seedKey = `${prefix}Seed`;

  const chars = element.dataset[charsKey] ?? element.dataset.scrambleChars;
  const overrideValue = element.dataset[overrideKey];

  return compactObject({
    text,
    chars,
    from: element.dataset[fromKey] ?? defaults.from,
    duration: parseNumber(element.dataset[durationKey]),
    revealRate: parseNumber(element.dataset[revealRateKey]),
    settleRate: parseNumber(element.dataset[settleRateKey]),
    settleDuration: parseNumber(element.dataset[settleDurationKey]),
    revealDelay: parseNumber(element.dataset[revealDelayKey]),
    delay: parseNumber(element.dataset[delayKey]),
    override: overrideValue ?? defaults.override,
    reversed: parseBoolean(element.dataset[reversedKey]),
    cursor: element.dataset[cursorKey] != null ? parseCursor(element.dataset[cursorKey]) : undefined,
    perturbation: parseNumber(element.dataset[perturbationKey]),
    seed: parseNumber(element.dataset[seedKey]),
  });
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
  return element.closest("a, button, input, select, textarea, [tabindex]") || element;
}

function resetHover(element) {
  cancelAnimation(element, true);
  setVisibleText(element, getText(element));
}

function startHoverAnimation(element) {
  const text = getText(element);

  cancelAnimation(element, true);

  const animation = animate(element, {
    innerHTML: scrambleText(
      readScrambleParams(element, "scrambleHover", {
        from: "left",
      }),
    ),
    onComplete: () => {
      activeAnimations.delete(element);
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

  if (prefersReducedMotion()) {
    setVisibleText(element, text);
    return;
  }

  const animation = animate(element, {
    autoplay: getAutoplay(element),
    innerHTML: scrambleText(
      readScrambleParams(element, "scrambleIntro", {
        from: "left",
        override: "",
      }),
    ),
    onComplete: () => {
      activeAnimations.delete(element);
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
