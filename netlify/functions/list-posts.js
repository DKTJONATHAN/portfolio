import { Octokit } from '@octokit/rest';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, JWT_SECRET } = process.env;
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // Log request details for debugging
    console.log('Received request:', { headers: event.headers, path: 'content/blog' });

    // Optional JWT verification for admin access
    const authHeader = event.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (!token) {
        console.log('No token provided in Authorization header');
        return { statusCode: 401, body: JSON.stringify({ message: 'No token provided' }) };
      }
      if (!JWT_SECRET) {
        console.log('JWT_SECRET not set in environment variables');
        return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error: JWT_SECRET not set' }) };
      }
      try {
        jwt.verify(token, JWT_SECRET);
        console.log('JWT verification successful');
      } catch (err) {
        console.log('JWT verification failed:', err.message);
        return { statusCode: 401, body: JSON.stringify({ message: `JWT verification failed: ${err.message}` }) };
      }
    }

    // Fetch files from content/blog/
    console.log('Fetching files from content/blog/');
    let files;
    try {
      const response = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: 'content/blog'
      });
      files = response.data;
      console.log('Files fetched:', files.map(f => f.name));
    } catch (err) {
      console.error('Error fetching content/blog:', err.message);
      return { statusCode: err.status || 500, body: JSON.stringify({ message: `Failed to fetch blog directory: ${err.message}` }) };
    }

    // Process markdown files
    const posts = await Promise.all(files.map(async (file) => {
      if (file.type !== 'file' || !file.name.endsWith('.md')) {
        console.log(`Skipping non-markdown file: ${file.name}`);
        return null;
      }
      try {
        console.log(`Fetching content for: ${file.path}`);
        const { data: content } = await octokit.repos.getContent({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: file.path
        });
        const decoded = Buffer.from(content.content, 'base64').toString();
        const match = decoded.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
        if (!match) {
          console.log(`Invalid frontmatter in: ${file.name}`);
          return null;
        }
        const frontmatter = match[1].split('\n').reduce((acc, line) => {
          const [key, value] = line.split(': ').map(s => s.trim().replace(/^["']|["']$/g, ''));
          if (key && value) acc[key] = key === 'tags' ? value.split(',').map(t => t.trim()) : value;
          return acc;
        }, {});
        console.log(`Parsed post: ${file.name}`, frontmatter);
        return { ...frontmatter, content: match[2], slug: file.name.replace('.md', '') };
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err.message);
        return null;
      }
    }));

    const validPosts = posts.filter(p => p);
    console.log('Valid posts:', validPosts.length, validPosts.map(p => p.slug));

    if (validPosts.length === 0) {
      console.log('No valid posts found');
      return {
        statusCode: 200,
        body: JSON.stringify([])
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(validPosts)
    };
  } catch (err) {
    console.error('Unexpected error in list-posts:', err.message);
    return { statusCode: 500, body: JSON.stringify({ message: `Server error: ${err.message}` }) };
  }
};