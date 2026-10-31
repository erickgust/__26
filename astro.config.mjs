import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";
import subsets from "./src/assets/fonts/subsets.json" with { type: "json" };

// Core files come first: Layout.astro preloads variant [0] of each family.
const split = (name, descriptors) =>
  ["core", "ext"].map((part) => ({
    src: [`./src/assets/fonts/${name}-${part}.woff2`],
    unicodeRange: subsets[name][part],
    ...descriptors,
  }));

// https://astro.build/config
export default defineConfig({
  output: "server",
  fonts: [
    {
      provider: fontProviders.local(),
      name: "PP Fraktion Mono Variable",
      cssVariable: "--font-pp-fraktion-mono",
      options: {
        variants: split("PPFraktionMono-Variable", {
          weight: "100 900",
          style: "normal",
        }),
      },
    },
    {
      provider: fontProviders.local(),
      name: "Geist Pixel",
      cssVariable: "--font-geist-pixel",
      options: {
        variants: split("GeistPixel-Square", {
          weight: "normal",
          style: "normal",
        }),
      },
    },
  ],

  adapter: cloudflare(),

  env: {
    schema: {
      PUBLIC_SERVER_URL: envField.string({
        access: "public",
        context: "client",
        default: "http://localhost:3000",
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  site: "https://erickgust.dev",
  integrations: [sitemap()],
});
