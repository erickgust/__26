# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio website for erickgust.dev, built with Astro (server output mode) and deployed to Cloudflare Workers via Wrangler. Uses Bun as the package manager/runtime.

## Commands

- `bun install` — install dependencies
- `bun run dev` — start the Astro dev server (with `--host`)
- `bun run build` — build the site
- `bun run preview` — preview the production build locally
- `bun run check-types` — run `astro check` (TypeScript)
- `bun run check` — run Biome (lint + format, `--write`)
- `bun run deploy` — deploy via `wrangler deploy`

There is no test suite in this repo. Biome (via lefthook pre-commit hook) handles linting/formatting on staged files automatically.

## Architecture

- **Astro + Cloudflare adapter**: `astro.config.mjs` configures `output: "server"` with `@astrojs/cloudflare()`. Local fonts are registered there (PP Fraktion Mono Variable, Geist Pixel) via `fontProviders.local()` and referenced as CSS variables (`--font-pp-fraktion-mono`, `--font-geist-pixel`).
- **Single-page layout**: `src/pages/index.astro` is the entire site — an intro/hero section (with an ASCII-art animation) followed by `#projects` and `#experiences` sections, then a footer. `src/layouts/Layout.astro` wraps every page with the `<head>` (meta/OG tags, JSON-LD `Person` schema, font preloads) and loads global click-sound behavior.
- **Compound components**: `Project` and `Experience` are namespace-style component groups (`src/components/Project/index.ts`, `src/components/Experience/index.ts`) re-exporting `Root`, `Header`, `Body`, `Title`/`Info`, `Description`, `Preview`/`Period`, etc. They are composed in `index.astro` like `<Project.Root><Project.Header .../><Project.Body>...</Project.Body></Project.Root>`. Follow this pattern when adding similar structured sections.
- **Site metadata**: `src/data/site.ts` exports the `SITE` const (name, title, description, url, email, socials) — the single source of truth used in `Layout.astro` and elsewhere; update there rather than hardcoding strings.
- **ASCII animation**: `src/ascii/frame_NNNN.txt` contains pre-rendered animation frames imported with Vite's `?raw` suffix (e.g. `frame_0000.txt?raw` in `index.astro`) and played by `src/scripts/ascii-animation.ts`.
- **Sound engine**: `src/lib/sound-engine.ts` implements a small Web Audio wrapper (`getAudioContext`, `decodeAudioData` with an in-memory buffer cache, `playSound`) operating on base64 data-URI audio assets. Sound asset typing/usage contracts live in `src/lib/sound-types.ts` (`SoundAsset`, `UseSoundOptions`, `PlayFunction`, `SoundControls`). `src/lib/soundcn/sounds/` holds the actual embedded sound data (e.g. `click-soft.ts`), consumed by `src/scripts/click-sound.ts`.
- **Client scripts**: page interactivity (ASCII animation, click sounds, clock, email-copy-to-clipboard, text scrambling) lives as plain TS modules in `src/scripts/`, imported from `<script>` tags inside `.astro` files rather than framework components — this project has no UI framework (React/Vue/etc.), only Astro components and vanilla TS.
- **Styling**: Tailwind CSS v4 via the Vite plugin (`@tailwindcss/vite`), global styles in `src/styles/global.css`. `cn()` in `src/lib/utils.ts` merges class names via `clsx` + `tailwind-merge`.
- **Env vars**: typed via Astro's `env.schema` in `astro.config.mjs` (currently `PUBLIC_SERVER_URL`).

## Linting/Formatting

Biome (`biome.json`) handles both lint and format with the `recommended` preset, double quotes for JS/TS, and import organization enabled. Tailwind directives are recognized in CSS. Run `bun run check` before committing if not relying on the lefthook pre-commit hook.
