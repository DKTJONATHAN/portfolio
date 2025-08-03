let posts = [];

// Immediately hide spinner and show content area
document.getElementById('loader').style.display = 'none';
document.getElementById('postList').style.visibility = 'visible';

async function fetchPosts() {
  try {
    // Try fetching from API first
    const response = await fetch('https://jonathanmwaniki.co.ke/api/fetch-posts');
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    posts = Array.isArray(data?.data) ? data.data : [];
    
    // If no posts, use fallback data but keep API structure
    if (posts.length === 0) {
      posts = generateSamplePosts();
      console.warn("Using sample data - API returned empty array");
    }
    
  } catch (error) {
    console.error("Fetch failed, using sample data:", error);
    posts = generateSamplePosts();
  } finally {
    renderCategories();
    renderPosts(posts);
  }
}

function generateSamplePosts() {
  const categories = ['News', 'Tech', 'Business', 'Entertainment'];
  const tags = ['Kenya', 'Politics', 'Economy', 'Startups', 'Innovation'];
  
  return Array.from({ length: 4 }, (_, i) => ({
    slug: `sample-post-${i+1}`,
    title: `Sample Post Title ${i+1}`,
    description: `This is a sample post description ${i+1}. Use this to test your layout and design.`,
    image: i % 2 === 0 ? 'https://via.placeholder.com/600x400?text=Sample+Image' : '',
    date: new Date(Date.now() - i * 86400000).toISOString(),
    category: categories[i % categories.length],
    tags: `${tags[i % tags.length]}, ${tags[(i + 1) % tags.length]}`,
    url: `#sample-${i+1}`
  }));
}

function renderPosts(postsToRender) {
  const postList = document.getElementById('postList');
  
  if (!postsToRender.length) {
    postList.innerHTML = `
      <div class="col-span-full text-center py-12">
        <h3 class="text-xl font-bold mb-2">No Posts Available</h3>
        <p class="text-gray-600 mb-4">We couldn't find any posts to display.</p>
        ${generateSamplePosts().map(post => postTemplate(post)).join('')}
      </div>`;
    return;
  }
  
  postList.innerHTML = postsToRender.map(post => postTemplate(post)).join('');
}

function postTemplate(post) {
  return `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      ${post.image ? `
        <img src="${post.image}" 
             alt="${post.title}" 
             class="w-full h-48 object-cover"
             onerror="this.style.display='none'">` : ''
      }
      <div class="p-4">
        <h2 class="text-xl font-bold mb-2">${post.title}</h2>
        <p class="text-gray-600 text-sm mb-2">${post.description}</p>
        <div class="flex justify-between text-gray-500 text-xs mb-3">
          <span class="font-medium">${post.category || 'General'}</span>
          <time>${new Date(post.date).toLocaleDateString()}</time>
        </div>
        ${post.tags ? `
          <div class="flex flex-wrap gap-1 mt-2">
            ${post.tags.split(',').map(tag => `
              <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">${tag.trim()}</span>
            `).join('')}
          </div>` : ''
        }
        <button class="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Read More
        </button>
      </div>
    </div>`;
}

function renderCategories() {
  const categories = ['All', ...new Set(posts.map(post => post.category || 'Uncategorized'))];
  const container = document.getElementById('categoryFilter');
  
  container.innerHTML = categories.map(category => `
    <button onclick="filterByCategory('${category}')"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
                   ${category === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
      ${category}
    </button>
  `).join('');
}

function filterPosts() {
  const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const selectedCategory = document.querySelector('#categoryFilter .bg-blue-600')?.textContent || 'All';
  
  const filtered = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      (post.tags && post.tags.toLowerCase().includes(query));
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  renderPosts(filtered);
}

function filterByCategory(category) {
  const buttons = document.querySelectorAll('#categoryFilter button');
  buttons.forEach(btn => {
    btn.classList.toggle('bg-blue-600', btn.textContent === category);
    btn.classList.toggle('text-white', btn.textContent === category);
    btn.classList.toggle('bg-gray-200', btn.textContent !== category);
    btn.classList.toggle('text-gray-700', btn.textContent !== category);
  });
  
  filterPosts();
}

// Initialize
fetchPosts();

// Make functions available globally for HTML event handlers
window.filterPosts = filterPosts;
window.filterByCategory = filterByCategory;