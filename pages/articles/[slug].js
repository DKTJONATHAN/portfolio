export default function Article({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

export async function getStaticPaths() {
  const response = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content/articles`,
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    }
  );
  const files = await response.json();
  // Ensure files is an array, handle single file or error case
  const paths = Array.isArray(files)
    ? files.map(file => ({
        params: { slug: file.name.replace(".html", "") },
      }))
    : [];

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const content = await fetch(
    `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/content/articles/${params.slug}.html`,
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    }
  ).then(res => res.text());

  return { props: { content } };
}