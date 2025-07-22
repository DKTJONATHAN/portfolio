document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('login-form');
    const adminPanel = document.getElementById('admin-panel');
    const createPostForm = document.getElementById('create-post');
    const postList = document.getElementById('post-list');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    // Check if on admin page
    if (loginForm && adminPanel) {
        const isLoggedIn = localStorage.getItem('admin-token');
        if (isLoggedIn) {
            loginForm.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            loadPosts();
        } else {
            loginForm.classList.remove('hidden');
            adminPanel.classList.add('hidden');
            loading.classList.add('hidden');
        }

        // Login
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loading.classList.remove('hidden');
            error.classList.add('hidden');
            const password = document.getElementById('admin-password').value;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const result = await response.json();
                if (response.ok) {
                    localStorage.setItem('admin-token', result.token);
                    loginForm.classList.add('hidden');
                    adminPanel.classList.remove('hidden');
                    loadPosts();
                } else {
                    error.classList.remove('hidden');
                    error.textContent = result.message || 'Login failed';
                }
            } catch (err) {
                error.classList.remove('hidden');
                error.textContent = 'Error: ' + err.message;
            }
            loading.classList.add('hidden');
        });

        // Create/Edit Post
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loading.classList.remove('hidden');
            error.classList.add('hidden');
            const formData = new FormData(createPostForm);
            const imageFile = formData.get('image-file');
            let imageUrl = formData.get('image');

            if (imageFile && imageFile.size > 0) {
                try {
                    const uploadResponse = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: imageFile
                    });
                    const uploadResult = await uploadResponse.json();
                    if (uploadResponse.ok) {
                        imageUrl = uploadResult.url;
                    } else {
                        error.classList.remove('hidden');
                        error.textContent = uploadResult.message || 'Image upload failed';
                        loading.classList.add('hidden');
                        return;
                    }
                } catch (err) {
                    error.classList.remove('hidden');
                    error.textContent = 'Error uploading image: ' + err.message;
                    loading.classList.add('hidden');
                    return;
                }
            }

            const postData = {
                title: formData.get('title'),
                category: formData.get('category'),
                tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
                image: imageUrl || '',
                date: formData.get('date'),
                content: formData.get('content'),
                slug: formData.get('title').toLowerCase().replace(/\s+/g, '-')
            };

            try {
                const response = await fetch('/api/blog-posts', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${localStorage.getItem('admin-token')}` 
                    },
                    body: JSON.stringify(postData)
                });
                const result = await response.json();
                if (response.ok) {
                    createPostForm.reset();
                    loadPosts();
                } else {
                    error.classList.remove('hidden');
                    error.textContent = result.message || 'Failed to save post';
                }
            } catch (err) {
                error.classList.remove('hidden');
                error.textContent = 'Error: ' + err.message;
            }
            loading.classList.add('hidden');
        });

        // Load Posts
        async function loadPosts() {
            loading.classList.remove('hidden');
            error.classList.add('hidden');
            try {
                const response = await fetch('/api/list-posts', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` }
                });
                if (!response.ok) throw new Error('Failed to load posts');
                const posts = await response.json();
                postList.innerHTML = '';
                posts.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'bg-white p-6 rounded-lg shadow-md';
                    postElement.innerHTML = `
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">${post.title}</h3>
                        <div class="flex items-center text-sm text-gray-600 mb-4">
                            <time>${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                            <span class="ml-4">${post.category}</span>
                        </div>
                        <form class="edit-post space-y-4">
                            <input type="hidden" name="slug" value="${post.slug}">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Title</label>
                                <input type="text" name="title" value="${post.title}" required class="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Category</label>
                                <input type="text" name="category" value="${post.category}" required class="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Tags</label>
                                <input type="text" name="tags" value="${post.tags?.join(', ')}" class="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Image URL</label>
                                <input type="text" name="image" value="${post.image}" class="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Image Upload</label>
                                <input type="file" name="image-file" accept="image/*" class="mt-1 w-full p-2 border border-gray-300 rounded-md">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Date</label>
                                <input type="date" name="date" value="${post.date}" required class="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Content</label>
                                <textarea name="content" rows="10" class="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">${post.content}</textarea>
                            </div>
                            <div class="flex space-x-4">
                                <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition">Update Post</button>
                                <button type="button" class="delete-post bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition">Delete Post</button>
                            </div>
                        </form>
                    `;
                    postList.appendChild(postElement);
                });

                // Edit Post
                document.querySelectorAll('.edit-post').forEach(form => {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        loading.classList.remove('hidden');
                        error.classList.add('hidden');
                        const formData = new FormData(form);
                        const imageFile = formData.get('image-file');
                        let imageUrl = formData.get('image');
                        if (imageFile && imageFile.size > 0) {
                            const uploadResponse = await fetch('/api/upload-image', {
                                method: 'POST',
                                body: imageFile
                            });
                            const uploadResult = await uploadResponse.json();
                            if (uploadResponse.ok) {
                                imageUrl = uploadResult.url;
                            } else {
                                error.classList.remove('hidden');
                                error.textContent = uploadResult.message || 'Image upload failed';
                                loading.classList.add('hidden');
                                return;
                            }
                        }
                        const postData = {
                            slug: formData.get('slug'),
                            title: formData.get('title'),
                            category: formData.get('category'),
                            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
                            image: imageUrl || '',
                            date: formData.get('date'),
                            content: formData.get('content')
                        };
                        try {
                            const response = await fetch('/api/blog-posts', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json', 
                                    'Authorization': `Bearer ${localStorage.getItem('admin-token')}` 
                                },
                                body: JSON.stringify(postData)
                            });
                            if (response.ok) {
                                loadPosts();
                            } else {
                                error.classList.remove('hidden');
                                error.textContent = 'Failed to update post';
                            }
                        } catch (err) {
                            error.classList.remove('hidden');
                            error.textContent = 'Error: ' + err.message;
                        }
                        loading.classList.add('hidden');
                    });
                });

                // Delete Post
                document.querySelectorAll('.delete-post').forEach(button => {
                    button.addEventListener('click', async () => {
                        if (!confirm('Are you sure you want to delete this post?')) return;
                        loading.classList.remove('hidden');
                        error.classList.add('hidden');
                        const slug = button.closest('form').querySelector('[name="slug"]').value;
                        try {
                            const response = await fetch('/api/blog-posts', {
                                method: 'DELETE',
                                headers: { 
                                    'Content-Type': 'application/json', 
                                    'Authorization': `Bearer ${localStorage.getItem('admin-token')}` 
                                },
                                body: JSON.stringify({ slug })
                            });
                            if (response.ok) {
                                loadPosts();
                            } else {
                                error.classList.remove('hidden');
                                error.textContent = 'Failed to delete post';
                            }
                        } catch (err) {
                            error.classList.remove('hidden');
                            error.textContent = 'Error: ' + err.message;
                        }
                        loading.classList.add('hidden');
                    });
                });
            } catch (err) {
                error.classList.remove('hidden');
                error.textContent = 'Error loading posts: ' + err.message;
                loading.classList.add('hidden');
            }
        }
    }

    // Blog Listing (for blog.html)
    const blogPosts = document.getElementById('blog-posts');
    const categoryList = document.getElementById('category-list');
    if (blogPosts && categoryList) {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');

        try {
            const response = await fetch('/api/list-posts');
            if (!response.ok) throw new Error('Failed to load posts');
            let posts = await response.json();
            if (category) {
                posts = posts.filter(post => post.category === category);
            }
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            const categories = [...new Set(posts.map(post => post.category))];

            categoryList.innerHTML = `
                <a href="/blog.html" class="category-tag">All</a>
                ${categories.map(cat => `<a href="/blog.html?category=${cat}" class="category-tag">${cat}</a>`).join('')}
            `;

            blogPosts.innerHTML = posts.length ? posts.map(post => `
                <article class="blog-post">
                    ${post.image ? `<div class="post-image"><img src="${post.image}" alt="${post.title}" loading="lazy"></div>` : ''}
                    <div class="post-content">
                        <h3 class="post-title"><a href="/blog-post.html?slug=${post.slug}">${post.title}</a></h3>
                        <div class="post-meta">
                            <time>${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                            <span class="post-category">${post.category}</span>
                        </div>
                        <div class="post-excerpt"><p>${marked.parse(post.content).split(' ').slice(0, 50).join(' ')}...</p></div>
                        <div class="post-actions">
                            <a href="/blog-post.html?slug=${post.slug}" class="btn-primary">Read More <i class="fas fa-arrow-right"></i></a>
                        </div>
                    </div>
                </article>
            `).join('') : '<div class="no-posts">No posts found.</div>';
        } catch (err) {
            blogPosts.innerHTML = `<div class="error-message">Couldn't load posts. <a href="/blog.html">Try again</a><p><small>${err.message}</small></p></div>`;
        }
    }
});