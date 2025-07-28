// /api/update-sitemap.js
import { Octokit } from '@octokit/rest';
import { xml2js, js2xml } from 'xml-js';

export default async function handler(req, res) {
  try {
    // Initialize Octokit with GitHub token
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Validate request method and body
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, lastmod, changefreq, priority } = req.body;
    if (!url || !lastmod || !changefreq || !priority) {
      return res.status(400).json({ error: 'Missing required fields: url, lastmod, changefreq, priority' });
    }

    // Path to sitemap.xml in the GitHub repository
    const sitemapPath = 'sitemap.xml';
    let sitemapContent, sitemapSha;

    // Try to fetch existing sitemap
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: sitemapPath,
      });
      sitemapContent = Buffer.from(data.content, 'base64').toString('utf-8');
      sitemapSha = data.sha; // Store SHA for updating the file
    } catch (error) {
      if (error.status === 404) {
        // If sitemap.xml doesn't exist, create a new one
        sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
      } else {
        throw new Error(`Failed to fetch sitemap: ${error.message}`);
      }
    }

    // Parse sitemap XML
    let sitemap;
    try {
      sitemap = xml2js(sitemapContent, { compact: true });
    } catch (error) {
      throw new Error(`Failed to parse sitemap XML: ${error.message}`);
    }

    // Ensure urlset exists
    if (!sitemap.urlset) {
      sitemap.urlset = { _attributes: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' }, url: [] };
    }

    // Normalize url array (handle single URL or array)
    if (!Array.isArray(sitemap.urlset.url)) {
      sitemap.urlset.url = sitemap.urlset.url ? [sitemap.urlset.url] : [];
    }

    // Check if URL already exists
    const existingUrlIndex = sitemap.urlset.url.findIndex(u => u.loc && u.loc._text === url);
    if (existingUrlIndex >= 0) {
      // Update existing URL
      sitemap.urlset.url[existingUrlIndex] = {
        loc: { _text: url },
        lastmod: { _text: lastmod },
        changefreq: { _text: changefreq },
        priority: { _text: priority }
      };
    } else {
      // Add new URL
      sitemap.urlset.url.push({
        loc: { _text: url },
        lastmod: { _text: lastmod },
        changefreq: { _text: changefreq },
        priority: { _text: priority }
      });
    }

    // Convert back to XML
    const updatedSitemap = js2xml(sitemap, { compact: true, spaces: 2 });

    // Commit updated sitemap to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: sitemapPath,
      message: `Update sitemap.xml with new URL: ${url}`,
      content: Buffer.from(updatedSitemap).toString('base64'),
      sha: sitemapSha, // Use SHA if updating existing file
      branch: 'main' // Adjust branch name if needed (e.g., 'master')
    });

    return res.status(200).json({ message: 'Sitemap updated successfully' });
  } catch (error) {
    console.error('Error updating sitemap:', error);
    return res.status(500).json({ error: `Failed to update sitemap: ${error.message}` });
  }
}