export default function Article({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

export async function getStaticPaths() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content/articles`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );
    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`);
      return { paths: [], fallback: false };
    }
    const files = await response.json();
    const paths = Array.isArray(files)
      ? files.map(file => ({
          params: { slug: file.name.replace(".html", "") },
        }))
      : [];
    return { paths, fallback: false };
  } catch (error) {
    console.error(`getStaticPaths error: ${error.message}`);
    return { paths: [], fallback: false };
  }
}

export async function getStaticProps({ params }) {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/content/articles/${params.slug}.html`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }
    const content = await response.text();
    return { props: { content } };
  } catch (error) {
    console.error(`getStaticProps error: ${error.message}`);
    return { notFound: true };
  }
}