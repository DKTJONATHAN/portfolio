import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Article() {
  const { slug } = useRouter().query;
  const [content, setContent] = useState("");

  useEffect(() => {
    if (slug) {
      fetch(
        `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/content/articles/${slug}.html`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          },
        }
      )
        .then(res => res.text())
        .then(data => setContent(data));
    }
  }, [slug]);

  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}