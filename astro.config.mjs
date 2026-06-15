import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  output: "server",
  fonts: [
    {
      provider: fontProviders.local(),
      name: "PP Fraktion Mono Variable",
      cssVariable: "--font-pp-fraktion-mono",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/PPFraktionMono-Variable.woff2"],
            weight: "100 900",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Geist Pixel",
      cssVariable: "--font-geist-pixel",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/GeistPixel-Square.woff2"],
            weight: "normal",
            style: "normal",
          },
        ],
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
