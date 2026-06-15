import type { APIRoute } from "astro";

const getRobotsTxt = (url: URL) => `\
Sitemap: ${url.href}
`;

export const GET: APIRoute = ({ site }) => {
  const url = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(url));
};
