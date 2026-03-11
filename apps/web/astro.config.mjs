import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  output: "server",

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Geist Mono",
        cssVariable: "--font-geist-mono",
        weights: ["100 900"],
      },
      {
        provider: fontProviders.fontsource(),
        name: "iA Writer Mono",
        cssVariable: "--font-writer-mono",
      },
    ],
  },

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
  integrations: [sitemap(), react()],
});
