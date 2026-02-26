import { useState } from "react";
import ScrambleIn from "./ScrambleIn";
import ScrambleHover from "./ScrambleHover";

interface ScrambleTextProps {
  text: string;
  direction?: "left" | "right";
  scrambleSpeed?: number;
  characters?: string;
  className?: string;
  scrambledClassName?: string;
}

export default function ScrambleText({
  text,
  direction = "left",
  scrambleSpeed = 50,
  characters,
  className,
  scrambledClassName,
}: ScrambleTextProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (isRevealed) {
    return (
      <ScrambleHover
        text={text}
        sequential
        revealDirection={direction === "right" ? "end" : "start"}
        scrambleSpeed={scrambleSpeed}
        characters={characters}
        className={className}
        scrambledClassName={scrambledClassName}
      />
    );
  }

  return (
    <ScrambleIn
      text={text}
      direction={direction}
      scrambleSpeed={scrambleSpeed}
      scrambledLetterCount={2}
      characters={characters}
      className={className}
      scrambledClassName={scrambledClassName}
      onComplete={() => setIsRevealed(true)}
    />
  );
}
