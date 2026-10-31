const FRAME_DELIMITER = "\n---FRAME---\n";

const FPS = 20;
const FRAME_DURATION = 1000 / FPS;

const modules = import.meta.glob<string>("../ascii/chunks/*.txt", {
  query: "?raw",
  import: "default",
});

let animationId: number | null = null;
let frameIndex = 0;
let direction = 1;

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

async function initAsciiAnimation() {
  stopAnimation();

  const pre = document.querySelector<HTMLPreElement>(
    "pre[data-ascii-animation]",
  );
  if (!pre) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const keys = Object.keys(modules).sort();
  if (keys.length === 0) return;

  const chunks = await Promise.all(keys.map((key) => modules[key]()));
  const frames = chunks.flatMap((chunk) => chunk.split(FRAME_DELIMITER));

  if (animationId !== null) return;

  let lastTimestamp = 0;

  function tick(timestamp: number) {
    if (timestamp - lastTimestamp >= FRAME_DURATION) {
      frameIndex += direction;
      if (frameIndex >= frames.length - 1) direction = -1;
      if (frameIndex <= 0) direction = 1;
      if (pre) pre.textContent = frames[frameIndex];
      lastTimestamp = timestamp;
    }
    animationId = requestAnimationFrame(tick);
  }

  animationId = requestAnimationFrame(tick);
}

let paused = false;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAnimation();
  } else if (!paused) {
    initAsciiAnimation();
  }
});

document.addEventListener("click", (event) => {
  const toggle =
    event.target instanceof Element &&
    event.target.closest("button[data-ascii-toggle]");
  if (!toggle) return;

  paused = !paused;
  toggle.textContent = paused ? "[▶]" : "[⬛]";
  toggle.setAttribute("aria-pressed", String(paused));
  if (paused) {
    stopAnimation();
  } else {
    initAsciiAnimation();
  }
});

document.addEventListener("astro:before-swap", stopAnimation);
document.addEventListener("astro:page-load", initAsciiAnimation);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAsciiAnimation, {
    once: true,
  });
} else {
  initAsciiAnimation();
}
