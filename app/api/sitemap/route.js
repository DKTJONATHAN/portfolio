export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(`<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://jonathanmwaniki.co.ke</loc></url>
</urlset>`, {
    headers: { 'Content-Type': 'text/xml' }
  });
}