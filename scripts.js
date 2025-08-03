let posts = [];

async function fetchPosts() {
  try {
    const response = await fetch('/api/fetch-posts');
    posts = await response.json();
    if (!Array.isArray(posts)) throw new Error('Invalid posts data');
    renderCategories();
    renderPosts(posts);
    document.getElementById('loader').style.display = 'none'; // Hide loader
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    document.getElementById('postList').innerHTML = '<p class="text-center text-muted col-span-full">Failed to load posts.</p>';
    document.getElementById('loader').style.display = 'none';
  }
}

function renderPosts(postsToRender) {
  const postList = document.getElementById('postList');
  postList.innerHTML = postsToRender.length ? '' : '<p class="text-center text-muted col-span-full">No posts found.</p>';
  postsToRender.forEach(post => {
    postList.innerHTML += `
      <a href="content/articles/${post.slug}.html" class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="w-full h-48 object-cover">` : ''}
        <div class="p-4">
          <h2 class="text-xl font-bold mb-2">${post.title}</h2>
          <p class="text-muted text-sm mb-2">${post.description}</p>
          <div class="flex justify-between text-muted text-sm">
            <span>${post.category}</span>
            <time>${new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
          </div>
          ${post.tags ? `<div class="flex flex-wrap gap-2 mt-2">${post.tags.split(',').map(tag => `<span class="bg-gray-200 text-xs px-2 py-1 rounded">${tag.trim()}</span>`).join('')}</div>` : ''}
          <button class="mt-4 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:opacity-90">Read More</button>
        </div>
      </a>
    `;
  });
}

function renderCategories() {
  const categories = ['All', ...new Set(posts.map(post => post.category))];
  const categoryFilter = document.getElementById('categoryFilter');
  categoryFilter.innerHTML = categories.map(category => `
    <button
      onclick="filterByCategory('${category}')"
      class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${category === 'All' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
    >${category}</button>
  `).join('');
}

function filterPosts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const selectedCategory = document.querySelector('#categoryFilter .bg-gradient-to-r')?.textContent || 'All';
  let filtered = posts;
  if (query) {
    filtered = filtered.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      (post.tags && post.tags.toLowerCase().includes(query))
    );
  }
  if (selectedCategory !== 'All') {
    filtered = filtered.filter(post => post.category === selectedCategory);
  }
  renderPosts(filtered);
}

function filterByCategory(category) {
  document.querySelectorAll('#categoryFilter button').forEach(btn => {
    btn.classList.remove('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white');
    btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  });
  event.target.classList.add('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white');
  event.target.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  filterPosts();
}

// Fetch posts on page load
fetchPosts();