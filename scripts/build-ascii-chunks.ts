import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ASCII_DIR = join(import.meta.dirname, "../src/ascii");
const CHUNKS_DIR = join(ASCII_DIR, "chunks");
const CHUNK_SIZE = 20;
const FRAME_DELIMITER = "\n---FRAME---\n";

const files = readdirSync(ASCII_DIR)
  .filter((file) => file.endsWith(".txt"))
  .sort();

if (files.length === 0) {
  throw new Error(`No frame .txt files found in ${ASCII_DIR}`);
}

rmSync(CHUNKS_DIR, { recursive: true, force: true });
mkdirSync(CHUNKS_DIR);

const [firstFrame, ...restFrames] = files;

writeFileSync(
  join(CHUNKS_DIR, "chunk_00.txt"),
  readFileSync(join(ASCII_DIR, firstFrame), "utf8"),
);

for (let i = 0; i < restFrames.length; i += CHUNK_SIZE) {
  const group = restFrames.slice(i, i + CHUNK_SIZE);
  const content = group
    .map((file) => readFileSync(join(ASCII_DIR, file), "utf8"))
    .join(FRAME_DELIMITER);
  const chunkIndex = String(Math.floor(i / CHUNK_SIZE) + 1).padStart(2, "0");
  writeFileSync(join(CHUNKS_DIR, `chunk_${chunkIndex}.txt`), content);
}

const chunkCount = 1 + Math.ceil(restFrames.length / CHUNK_SIZE);
console.log(
  `Merged ${files.length} frames into ${chunkCount} chunk(s) in ${CHUNKS_DIR}`,
);

for (const file of files) {
  rmSync(join(ASCII_DIR, file));
}

console.log(`Deleted ${files.length} source frame file(s) from ${ASCII_DIR}`);
