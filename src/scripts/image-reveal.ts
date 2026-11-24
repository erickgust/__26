const GLYPHS = "abcdefghijklmnopqrstuvwxyz.,:;=<>(){}[]_";
const FONT_SIZE = 12;
const LINE_HEIGHT = 14;
const HOLD = 250;
const SWEEP = 500;
const SWEEP_JITTER = 200;
const IMAGE_DELAY = 250;
const IMAGE_SPREAD = 700;
const IMAGE_JITTER = 100;
const DECODE = 160;
const FLASH = 0.5;

const seeded = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

const luminance = (r: number, g: number, b: number) =>
  0.299 * r + 0.587 * g + 0.114 * b;

const mix = (r: number, g: number, b: number, amount: number) => {
  const toward = luminance(r, g, b) > 140 ? 0 : 255;
  const channel = (c: number) => c + (toward - c) * amount;
  return `rgb(${channel(r)} ${channel(g)} ${channel(b)})`;
};

function sampleColors(
  image: HTMLImageElement | null | undefined,
  cols: number,
  rows: number,
) {
  const sampler = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!sampler) return new Uint8ClampedArray(cols * rows * 4);
  sampler.canvas.width = cols;
  sampler.canvas.height = rows;
  sampler.imageSmoothingQuality = "high";
  if (image) sampler.drawImage(image, 0, 0, cols, rows);
  return sampler.getImageData(0, 0, cols, rows).data;
}

async function reveal(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();

  const image = canvas.parentElement?.querySelector("img");
  const root = getComputedStyle(document.documentElement);
  const paper = root.getPropertyValue("--color-white");
  const ink = root.getPropertyValue("--color-blue");
  const font = `${FONT_SIZE}px ${root.getPropertyValue("--font-mono")}`;
  await Promise.all([
    document.fonts.load(font).catch(() => {}),
    image?.decode().catch(() => {}),
  ]);

  const { width, height } = canvas.getBoundingClientRect();
  const dpr = devicePixelRatio;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.font = font;
  ctx.textBaseline = "top";

  const cellWidth = ctx.measureText("M").width;
  const cols = Math.ceil(width / cellWidth);
  const rows = Math.ceil(height / LINE_HEIGHT);
  const pixels = sampleColors(image, cols, rows);

  const lights = Array.from({ length: cols * rows }, (_, i) =>
    luminance(pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]),
  );
  const darkest = Math.min(...lights);
  const range = Math.max(...lights) - darkest || 1;

  const cells = lights.map((light, i) => {
    const [r, g, b] = pixels.subarray(i * 4, i * 4 + 3);
    const row = Math.floor(i / cols);
    const brightness = (light - darkest) / range;
    return {
      x: (i % cols) * cellWidth,
      y: row * LINE_HEIGHT,
      glyph: randomGlyph(),
      alpha: 0.2 + Math.random() * 0.3,
      shade: mix(r, g, b, 0),
      color: mix(r, g, b, 0.35),
      flash: mix(r, g, b, FLASH),
      sweepStart: HOLD + (row / rows) * SWEEP + Math.random() * SWEEP_JITTER,
      imageStart:
        HOLD +
        IMAGE_DELAY +
        brightness * IMAGE_SPREAD +
        seeded(i) * IMAGE_JITTER,
    };
  });
  const end =
    Math.max(
      ...cells.map((cell) => Math.max(cell.imageStart, cell.sweepStart)),
    ) + DECODE;
  const origin = performance.now();

  const frame = (now: number) => {
    const elapsed = now - origin;
    ctx.clearRect(0, 0, width, height);

    for (const cell of cells) {
      const sweep = elapsed - cell.sweepStart;
      const dissolve = elapsed - cell.imageStart;
      const onPaper = sweep <= DECODE;
      if (!onPaper && dissolve > DECODE) continue;

      const decoding = onPaper ? sweep > 0 : dissolve > 0;
      if (decoding || Math.random() < 0.01) cell.glyph = randomGlyph();

      ctx.globalAlpha = 1;
      ctx.fillStyle = onPaper ? paper : cell.shade;
      ctx.fillRect(cell.x, cell.y, cellWidth + 1, LINE_HEIGHT + 1);

      if (onPaper) {
        ctx.globalAlpha = decoding ? 1 : cell.alpha;
        ctx.fillStyle = ink;
      } else {
        ctx.fillStyle = decoding ? cell.flash : cell.color;
      }
      ctx.fillText(cell.glyph, cell.x, cell.y);
    }

    if (elapsed < end) requestAnimationFrame(frame);
    else canvas.remove();
  };

  frame(origin);
  canvas.style.background = "transparent";
}

const canvases = document.querySelectorAll<HTMLCanvasElement>(
  "canvas[data-image-reveal]",
);

if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  for (const canvas of canvases) canvas.remove();
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        reveal(entry.target as HTMLCanvasElement);
      }
    },
    { threshold: 0.3 },
  );
  for (const canvas of canvases) observer.observe(canvas);
}
