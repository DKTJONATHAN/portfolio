// pages/api/list-posts.js
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data: files } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles',
    });

    const posts = await Promise.all(
      files
        .filter(file => file.name.endsWith('.md'))
        .map(async (file) => {
          const { data } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: file.path,
          });

          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          
          // Extract frontmatter
          const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
          const match = content.match(frontmatterRegex);
          
          let metadata = {};
          if (match) {
            const frontmatter = match[1];
            metadata = frontmatter.split('\n').reduce((acc, line) => {
              const [key, ...value] = line.split(':');
              if (key && value.length) {
                acc[key.trim()] = value.join(':').trim();
              }
              return acc;
            }, {});
          }

          return {
            slug: file.name.replace('.md', ''),
            title: metadata.title || file.name.replace('.md', ''),
            description: metadata.description || '',
            date: metadata.date || new Date().toISOString(),
            category: metadata.category || 'News',
            tags: metadata.tags || '',
            image: metadata.image || '',
          };
        })
    );

    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      data: posts,
      error: null
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({
      error: 'Failed to fetch posts',
      details: error.message
    });
  }
}