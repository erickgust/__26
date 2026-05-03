import { animate, onScroll, scrambleText, type JSAnimation } from "animejs";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";

import { cn } from "../../lib/utils";
import { getIntroScrambleParams, type ScrambleDirection } from "./anime-scramble";

const DEFAULT_CHARACTERS = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";

interface ScrambleInProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  text: string;
  scrambleSpeed?: number;
  scrambledLetterCount?: number;
  characters?: string;
  scrambledClassName?: string;
  autoStart?: boolean;
  direction?: ScrambleDirection;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface ScrambleInHandle {
  start: () => void;
  reset: () => void;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const ScrambleIn = forwardRef<ScrambleInHandle, ScrambleInProps>(
  (
    {
      text,
      scrambleSpeed = 50,
      scrambledLetterCount = 2,
      characters = DEFAULT_CHARACTERS,
      className = "",
      scrambledClassName = "",
      autoStart = true,
      direction = "left",
      onStart,
      onComplete,
      ...props
    },
    ref,
  ) => {
    const textRef = useRef<HTMLSpanElement>(null);
    const animationRef = useRef<JSAnimation | null>(null);
    const onStartRef = useRef(onStart);
    const onCompleteRef = useRef(onComplete);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      onStartRef.current = onStart;
    }, [onStart]);

    useEffect(() => {
      onCompleteRef.current = onComplete;
    }, [onComplete]);

    const setVisibleText = useCallback((value: string) => {
      if (textRef.current) {
        textRef.current.textContent = value;
      }
    }, []);

    const stopAnimation = useCallback((revert = true) => {
      if (!animationRef.current) {
        return;
      }

      if (revert) {
        animationRef.current.revert();
      } else {
        animationRef.current.cancel();
      }

      animationRef.current = null;
    }, []);

    const reset = useCallback(() => {
      stopAnimation(true);
      setIsAnimating(false);
      setVisibleText("");
    }, [setVisibleText, stopAnimation]);

    const startAnimation = useCallback(
      (useScrollTrigger: boolean) => {
        const element = textRef.current;

        if (!element) {
          return;
        }

        stopAnimation(true);
        setVisibleText("");

        if (prefersReducedMotion()) {
          onStartRef.current?.();
          setVisibleText(text);
          setIsAnimating(false);
          onCompleteRef.current?.();
          return;
        }

        animationRef.current = animate(element, {
          autoplay: useScrollTrigger
            ? onScroll({
                target: element,
                repeat: false,
              })
            : true,
          innerHTML: scrambleText(
            getIntroScrambleParams({
              text,
              direction,
              scrambleSpeed,
              scrambledLetterCount,
              characters,
              fallbackChars: DEFAULT_CHARACTERS,
            }),
          ),
          onBegin: () => {
            setIsAnimating(true);
            onStartRef.current?.();
          },
          onComplete: () => {
            setVisibleText(text);
            setIsAnimating(false);
            onCompleteRef.current?.();
          },
        });
      },
      [characters, direction, scrambleSpeed, scrambledLetterCount, setVisibleText, stopAnimation, text],
    );

    useImperativeHandle(
      ref,
      () => ({
        start: () => startAnimation(false),
        reset,
      }),
      [reset, startAnimation],
    );

    useEffect(() => {
      if (!autoStart) {
        reset();
        return;
      }

      startAnimation(true);

      return () => {
        stopAnimation(true);
      };
    }, [autoStart, reset, startAnimation, stopAnimation]);

    return (
      <>
        <span className="sr-only">{text}</span>
        <span
          ref={textRef}
          className={cn("inline-block whitespace-pre-wrap", className, isAnimating && scrambledClassName)}
          aria-hidden="true"
          {...props}
        />
      </>
    );
  },
);

ScrambleIn.displayName = "ScrambleIn";
export default ScrambleIn;
