# erickgust.dev

Personal portfolio website for [`erickgust.dev`](https://erickgust.dev).

Built with Astro in a small Bun + Turborepo workspace and deployed to Cloudflare.

## Stack

- Astro
- TypeScript
- Tailwind CSS
- Bun
- Turborepo
- Cloudflare

## Project Structure

```text
__26/
├── apps/
│   └── web/          # Astro app
├── packages/
│   └── config/       # shared config
├── package.json
└── turbo.json
```

## Getting Started

Install dependencies:

```bash
bun install
```

Start the website locally:

```bash
bun run dev:web
```

## Scripts

- `bun run dev` — run the workspace in development mode
- `bun run dev:web` — run the web app only
- `bun run build` — build the project
- `bun run check-types` — run type checks
- `bun run check` — run formatting and linting
- `bun run deploy:web` — deploy the site

## Editing Content

Most site content lives here:

- `apps/web/src/pages/index.astro`
- `apps/web/src/data/site.ts`
- `apps/web/src/components/`

## Deployment

The site is configured to deploy to Cloudflare using Wrangler.
