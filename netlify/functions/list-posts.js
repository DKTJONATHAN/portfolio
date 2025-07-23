const { Octokit } = require('@octokit/rest');

exports.handler = async function () {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = 'content/blog';

    const { data } = await octokit.repos.getContent({ owner, repo, path });
    const posts = [];

    for (const file of data) {
      if (file.type === 'file' && file.name.endsWith('.md')) {
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });
        const content = Buffer.from(fileData.content, 'base64').toString();
        const frontMatterMatch = content.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
        if (frontMatterMatch) {
          const frontMatter = frontMatterMatch[1];
          const markdownContent = frontMatterMatch[2];
          const post = {
            slug: file.name.replace('.md', ''),
            content: markdownContent,
          };
          frontMatter.split('\n').forEach(line => {
            const [key, value] = line.split(': ').map(s => s.trim());
            if (key && value) {
              post[key] = key === 'tags' ? value.replace(/\[|\]/g, '').split(',').map(t => t.trim()) : value.replace(/^"(.*)"$/, '$1');
            }
          });
          posts.push(post);
        }
      }
    }

    console.log('Posts processed:', posts.length);
    return {
      statusCode: 200,
      body: JSON.stringify(posts),
    };
  } catch (error) {
    console.error('List posts error:', error.message, error.stack);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: `Failed to list posts: ${error.message}` }),
    };
  }
};