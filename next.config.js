module.exports = {
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      {
        source: '/rss.xml',
        destination: '/api/rss.xml',
      }
    ];
  },
  // Prevent static files from overriding routes
  async exportPathMap() {
    return {
      '/rss.xml': { page: '/api/rss' },
      '/sitemap.xml': { page: '/api/sitemap' }
    }
  }
};