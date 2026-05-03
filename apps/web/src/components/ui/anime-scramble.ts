import type { ScrambleTextParams } from "animejs";

export type ScrambleDirection = "left" | "right";
export type RevealDirection = "start" | "end" | "center";

const MIN_SCRAMBLE_SPEED = 16;
const MIN_SETTLE_DURATION = 250;

interface ResolveCharsOptions {
  text: string;
  fallback: string;
  characters?: string;
  useOriginalCharsOnly?: boolean;
}

interface IntroScrambleOptions {
  text: string;
  direction: ScrambleDirection;
  scrambleSpeed: number;
  scrambledLetterCount: number;
  characters?: string;
  fallbackChars: string;
}

interface HoverScrambleOptions {
  text: string;
  scrambleSpeed: number;
  maxIterations: number;
  sequential: boolean;
  revealDirection: RevealDirection;
  useOriginalCharsOnly: boolean;
  characters?: string;
  fallbackChars: string;
}

function getRevealRate(scrambleSpeed: number) {
  return Math.max(1, Math.round(1000 / Math.max(scrambleSpeed, MIN_SCRAMBLE_SPEED)));
}

export function resolveScrambleChars({
  text,
  fallback,
  characters,
  useOriginalCharsOnly = false,
}: ResolveCharsOptions) {
  if (!useOriginalCharsOnly) {
    return characters || fallback;
  }

  const uniqueChars = Array.from(
    new Set(text.replaceAll(/\s+/g, "").split("")),
  ).join("");

  return uniqueChars || characters || fallback;
}

export function getDirectionFrom(direction: ScrambleDirection) {
  return direction === "right" ? "right" : "left";
}

export function getHoverFromDirection(revealDirection: RevealDirection) {
  switch (revealDirection) {
    case "end":
      return "right";
    case "center":
      return "center";
    default:
      return "left";
  }
}

export function getIntroScrambleParams({
  text,
  direction,
  scrambleSpeed,
  scrambledLetterCount,
  characters,
  fallbackChars,
}: IntroScrambleOptions): ScrambleTextParams {
  const revealRate = getRevealRate(scrambleSpeed);

  return {
    text,
    chars: resolveScrambleChars({
      text,
      characters,
      fallback: fallbackChars,
    }),
    ease: "linear",
    from: getDirectionFrom(direction),
    override: "",
    revealRate,
    settleRate: revealRate,
    settleDuration: Math.max(
      MIN_SETTLE_DURATION,
      scrambleSpeed * Math.max(scrambledLetterCount, 1) * 6,
    ),
  };
}

export function getHoverScrambleParams({
  text,
  scrambleSpeed,
  maxIterations,
  sequential,
  revealDirection,
  useOriginalCharsOnly,
  characters,
  fallbackChars,
}: HoverScrambleOptions): ScrambleTextParams {
  const revealRate = getRevealRate(scrambleSpeed);

  return {
    text,
    chars: resolveScrambleChars({
      text,
      characters,
      fallback: fallbackChars,
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
