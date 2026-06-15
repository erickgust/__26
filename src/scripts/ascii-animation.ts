const FPS = 20;
const FRAME_DURATION = 1000 / FPS;

const modules = import.meta.glob<string>("../ascii/*.txt", {
  query: "?raw",
  import: "default",
});

let animationId: number | null = null;

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

  const frames = await Promise.all(keys.map((key) => modules[key]()));

  if (animationId !== null) return;

  let frameIndex = 0;
  let direction = 1;
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

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
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
