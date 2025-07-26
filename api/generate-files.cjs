import { Octokit } from '@octokit/rest';
import { marked } from 'marked';
import yaml from 'js-yaml';
import sanitizeHtml from 'sanitize-html';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data: files } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles',
    });

    const posts = [];
    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const { data: content } = await octokit.repos.getContent({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          path: file.path,
        });
        const fileContent = Buffer.from(content.content, 'base64').toString();
        const frontmatter = yaml.load(fileContent.split('---')[1]);
        const markdown = fileContent.split('---')[2];
        posts.push({
          slug: file.name.replace('.md', ''),
          title: frontmatter.title,
          date: frontmatter.date,
          category: frontmatter.category,
          tags: frontmatter.tags,
          image: frontmatter.image,
          content: sanitizeHtml(marked.parse(markdown)),
        });
      }
    }

    const contentBase64 = Buffer.from(JSON.stringify(posts)).toString('base64');
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'posts.json',
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'posts.json',
      message: 'Generate posts.json from markdown files',
      content: contentBase64,
      sha: sha || undefined,
    });

    return res.status(200).json({ message: 'Posts generated successfully' });
  } catch (error) {
    return res.status(500).json({ error: `Failed to generate posts: ${error.message}` });
  }
}
