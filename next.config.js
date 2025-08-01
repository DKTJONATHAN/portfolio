/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      {
        source: '/rss.xml',
        destination: '/api/rss',
      },
    ];
  },
  experimental: {
    appDocumentPreloading: false,
  },
};