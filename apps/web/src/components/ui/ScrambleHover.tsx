import { animate, scrambleText, type JSAnimation } from "animejs";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEventHandler,
  type MouseEventHandler,
} from "react";

import { cn } from "../../lib/utils";
import { getHoverScrambleParams, type RevealDirection } from "./anime-scramble";

const DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";

interface ScrambleHoverProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  text: string;
  scrambleSpeed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: RevealDirection;
  useOriginalCharsOnly?: boolean;
  characters?: string;
  scrambledClassName?: string;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const ScrambleHover = ({
  text,
  scrambleSpeed = 50,
  maxIterations = 10,
  useOriginalCharsOnly = false,
  characters = DEFAULT_CHARACTERS,
  className,
  scrambledClassName,
  sequential = false,
  revealDirection = "start",
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ScrambleHoverProps) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<JSAnimation | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const resetText = useCallback(() => {
    stopAnimation(true);
    setIsAnimating(false);
    setVisibleText(text);
  }, [setVisibleText, stopAnimation, text]);

  const startAnimation = useCallback(() => {
    const element = textRef.current;

    if (!element) {
      return;
    }

    stopAnimation(true);
    setVisibleText(text);

    if (prefersReducedMotion()) {
      setIsAnimating(false);
      return;
    }

    animationRef.current = animate(element, {
      innerHTML: scrambleText(
        getHoverScrambleParams({
          text,
          scrambleSpeed,
          maxIterations,
          sequential,
          revealDirection,
          useOriginalCharsOnly,
          characters,
          fallbackChars: DEFAULT_CHARACTERS,
        }),
      ),
      onBegin: () => {
        setIsAnimating(true);
      },
      onComplete: () => {
        setVisibleText(text);
        setIsAnimating(false);
      },
    });
  }, [
    characters,
    maxIterations,
    revealDirection,
    scrambleSpeed,
    sequential,
    setVisibleText,
    stopAnimation,
    text,
    useOriginalCharsOnly,
  ]);

  useEffect(() => {
    setVisibleText(text);
  }, [setVisibleText, text]);

  useEffect(() => {
    const element = textRef.current;

    if (!element) {
      return;
    }

    const interactiveParent = element.closest("a, button, input, select, textarea, [tabindex]");

    if (!interactiveParent || interactiveParent === element) {
      return;
    }

    interactiveParent.addEventListener("focus", startAnimation);
    interactiveParent.addEventListener("blur", resetText);

    return () => {
      interactiveParent.removeEventListener("focus", startAnimation);
      interactiveParent.removeEventListener("blur", resetText);
    };
  }, [resetText, startAnimation]);

  useEffect(() => {
    return () => {
      stopAnimation(true);
    };
  }, [stopAnimation]);

  const handleMouseEnter: MouseEventHandler<HTMLSpanElement> = (event) => {
    onMouseEnter?.(event);
    startAnimation();
  };

  const handleMouseLeave: MouseEventHandler<HTMLSpanElement> = (event) => {
    onMouseLeave?.(event);
    resetText();
  };

  const handleFocus: FocusEventHandler<HTMLSpanElement> = (event) => {
    onFocus?.(event);
    startAnimation();
  };

  const handleBlur: FocusEventHandler<HTMLSpanElement> = (event) => {
    onBlur?.(event);
    resetText();
  };

  return (
    <>
      <span className="sr-only">{text}</span>
      <span
        ref={textRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn("inline-block whitespace-pre-wrap", className, isAnimating && scrambledClassName)}
        aria-hidden="true"
        {...props}
      >
        {text}
      </span>
    </>
  );
};

export default ScrambleHover;
