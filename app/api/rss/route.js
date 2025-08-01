export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(`<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <title>Mwaniki Reports</title>
  <item><title>Test Post</title></item>
</channel>
</rss>`, {
    headers: { 'Content-Type': 'application/rss+xml' }
  });
}