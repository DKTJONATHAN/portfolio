const { Octokit } = require("@octokit/rest");

exports.handler = async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const path = "content/articles";

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    
    const posts = await Promise.all(data.map(async (file) => {
      if (file.name.endsWith('.html')) {
        const content = await octokit.repos.getContent({ owner, repo, path: file.path });
        const decoded = Buffer.from(content.data.content, 'base64').toString('utf8');
        
        // Extract front matter
        const frontMatter = decoded.split('---')[1];
        const contentHtml = decoded.split('---')[2];
        
        const metadata = {};
        frontMatter.split('\n').forEach(line => {
          const match = line.match(/(\w+):\s*(.*)/);
          if (match) {
            let value = match[2].trim();
            // Remove surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            metadata[match[1]] = value;
          }
        });

        return {
          title: metadata.title,
          slug: file.name.replace('.html', ''),
          date: metadata.date,
          category: metadata.category,
          tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim().replace(/["\[\]]/g, '')) : [],
          image: metadata.image,
          description: metadata.description,
          content: contentHtml.trim()
        };
      }
      return null;
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(posts.filter(Boolean))
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};