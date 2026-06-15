# erickgust.dev

Personal portfolio website for [`erickgust.dev`](https://erickgust.dev).

Built with Astro and deployed to Cloudflare.

## Stack

- Astro
- TypeScript
- Tailwind CSS
- Bun
- Cloudflare

## Project Structure

```text
__26/
├── src/
│   ├── components/
│   ├── data/
│   ├── layouts/
│   ├── pages/
│   └── styles/
├── public/
├── astro.config.mjs
├── wrangler.jsonc
└── package.json
```

## Getting Started

Install dependencies:

```bash
bun install
```

Start the website locally:

```bash
bun run dev
```

## Scripts

- `bun run dev` — start the dev server
- `bun run build` — build the project
- `bun run preview` — preview the production build locally
- `bun run check-types` — run type checks
- `bun run check` — run formatting and linting
- `bun run deploy` — deploy the site

## Deployment

The site is configured to deploy to Cloudflare using Wrangler.
