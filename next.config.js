/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap.js', // Points to root-level API file
      },
      {
        source: '/rss.xml',
        destination: '/api/rss.xml.js', // Points to root-level API file
      },
    ];
  },
  // Optional: Add if you need static generation
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};