// ====================
// MAIN POSTS CONTROLLER
// ====================
let posts = [];

// 1. IMMEDIATELY INITIALIZE UI
document.getElementById('loader').remove(); // Remove spinner completely

// 2. SHOW BRANDED SPLASH SCREEN
const splashHTML = `
  <div id="splash" class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4 transition-opacity duration-500">
    <img src="images/Jonathan-Mwaniki-logo.png" alt="Logo" class="h-20 animate-pulse">
    <div class="text-sm text-gray-500">Loading your experience...</div>
  </div>
`;
document.body.insertAdjacentHTML('afterbegin', splashHTML);

// 3. HIDE SPLASH AFTER 2 SECONDS (REGARDLESS OF CONTENT LOAD)
setTimeout(() => {
  document.getElementById('splash').style.opacity = '0';
  setTimeout(() => document.getElementById('splash').remove(), 500);
}, 2000);

// 4. INITIAL RENDER WITH EMPTY STATE
renderCategories();
renderPosts([]); // Show empty state immediately

// 5. LOAD POSTS IN BACKGROUND
fetchPosts();

// ====================
// CORE FUNCTIONS
// ====================
async function fetchPosts() {
  try {
    // Try production API first
    let response = await fetch('https://jonathanmwaniki.co.ke/api/fetch-posts');
    
    // Fallback to direct GitHub if needed
    if (!response.ok) {
      response = await fetch('https://api.github.com/repos/your-username/your-repo/contents/content/articles.json', {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        }
      });
    }

    const data = await response.json();
    posts = Array.isArray(data) ? data : [];
    
  } catch (error) {
    console.error("Posts load error:", error);
    posts = generateFallbackPosts();
  } finally {
    updateUI();
  }
}

function generateFallbackPosts() {
  const fallbacks = [];
  const categories = ['News', 'Tech', 'Business', 'Entertainment'];
  const tags = ['Kenya', 'Politics', 'Innovation', 'Economy'];
  
  for (let i = 0; i < 6; i++) {
    fallbacks.push({
      slug: `fallback-${i}`,
      title: `Sample Post ${i+1}`,
      description: 'This is placeholder content while we load the latest posts.',
      image: `https://source.unsplash.com/random/600x400?${categories[i%4]}`,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      category: categories[i%4],
      tags: `${tags[i%4]}, ${tags[(i+1)%4]}`
    });
  }
  return fallbacks;
}

function updateUI() {
  renderCategories();
  renderPosts(posts);
  document.querySelectorAll('#postList a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.href.includes('fallback-')) e.preventDefault();
    });
  });
}

// ====================
// RENDER FUNCTIONS
// ====================
function renderPosts(postsToRender) {
  const postList = document.getElementById('postList');
  
  if (!postsToRender.length) {
    postList.innerHTML = `
      <div class="col-span-full text-center py-12">
        <h3 class="text-xl font-bold mb-4">Welcome to Mwaniki Reports</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${generateFallbackPosts().slice(0, 3).map(post => renderPostCard(post)).join('')}
        </div>
      </div>`;
    return;
  }

  postList.innerHTML = postsToRender.map(post => renderPostCard(post)).join('');
}

function renderPostCard(post) {
  return `
    <a href="${post.slug.includes('fallback') ? '#' : `/content/articles/${post.slug}.html`}" 
       class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 block h-full">
      ${post.image ? `
        <img src="${post.image}" 
             alt="${post.title}"
             class="w-full h-48 object-cover"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/600x400?text=News+Image'">` : ''}
      
      <div class="p-4 flex flex-col h-[calc(100%-12rem)]">
        <h2 class="text-xl font-bold mb-2 line-clamp-2">${post.title}</h2>
        <p class="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">${post.description}</p>
        
        <div class="flex justify-between items-center mt-auto">
          <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
            ${post.category || 'General'}
          </span>
          <time class="text-xs text-gray-500">
            ${new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>
      </div>
    </a>`;
}

function renderCategories() {
  const categories = ['All', ...new Set(posts.map(post => post.category || 'General'))];
  const container = document.getElementById('categoryFilter');
  
  container.innerHTML = categories.map(cat => `
    <button onclick="filterByCategory('${cat}')"
            class="category-btn px-4 py-2 rounded-lg text-sm font-medium transition-all
                   ${cat === 'All' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'bg-gray-100 hover:bg-gray-200'}">
      ${cat}
    </button>
  `).join('');
}

// ====================
// FILTER FUNCTIONS
// ====================
function filterPosts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const activeCat = document.querySelector('.category-btn.bg-gradient-to-r')?.textContent || 'All';
  
  const filtered = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(query) || 
                         post.description.toLowerCase().includes(query);
    const matchesCategory = activeCat === 'All' || post.category === activeCat;
    return matchesSearch && matchesCategory;
  });
  
  renderPosts(filtered.length ? filtered : posts);
}

function filterByCategory(category) {
  document.querySelectorAll('.category-btn').forEach(btn => {
    const isActive = btn.textContent === category;
    btn.classList.toggle('bg-gradient-to-r', isActive);
    btn.classList.toggle('from-primary', isActive);
    btn.classList.toggle('to-secondary', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('bg-gray-100', !isActive);
  });
  
  filterPosts();
}

// ====================
// INITIALIZE
// ====================
window.filterPosts = filterPosts;
window.filterByCategory = filterByCategory;

// Optional: Load more when scrolling
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    // Implement pagination here if needed
  }
});