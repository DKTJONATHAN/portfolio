import Link from 'next/link';

export default function ArticleCard({ post, compact = false }) {
  return (
    <div className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow ${compact ? '' : 'h-full'}`}>
      <Link href={`/articles/${post.slug}`}>
        <a className="block h-full">
          <div className="p-6 h-full flex flex-col">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-3 self-start">
              {post.category}
            </span>
            <h3 className={`font-bold mb-2 ${compact ? 'text-lg' : 'text-xl'}`}>{post.title}</h3>
            <p className={`text-gray-600 mb-4 ${compact ? 'text-sm' : ''}`}>{post.excerpt}</p>
            <div className="mt-auto text-sm text-gray-500">
              {new Date(post.date).toLocaleDateString()} • {post.readingTime || '5 min'} read
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
}