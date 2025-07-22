document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('login-form');
    const adminPanel = document.getElementById('admin-panel');
    const createPostForm = document.getElementById('create-post');
    const postList = document.getElementById('post-list');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    // Check if logged in (using localStorage for simplicity)
    const isLoggedIn = localStorage.getItem('admin-token');
    if (isLoggedIn) {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        loadPosts();
    } else {
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
        loading.style.display = 'none';
    }

    // Login
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
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
                loginForm.style.display = 'none';
                adminPanel.style.display = 'block';
                loadPosts();
            } else {
                error.style.display = 'block';
                error.textContent = result.message || 'Login failed';
            }
        } catch (err) {
            error.style.display = 'block';
            error.textContent = 'Error: ' + err.message;
        }
    });

    // Create/Edit Post
    createPostForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        loading.style.display = 'block';
        error.style.display = 'none';
        const formData = new FormData(createPostForm);
        const imageFile = formData.get('image-file');
        let imageUrl = formData.get('image');

        // Upload image if provided
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
                    error.style.display = 'block';
                    error.textContent = uploadResult.message || 'Image upload failed';
                    loading.style.display = 'none';
                    return;
                }
            } catch (err) {
                error.style.display = 'block';
                error.textContent = 'Error uploading image: ' + err.message;
                loading.style.display = 'none';
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
            const response = await fetch('/api/storesubmission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
                body: JSON.stringify(postData)
            });
            const result = await response.json();
            if (response.ok) {
                createPostForm.reset();
                loadPosts();
            } else {
                error.style.display = 'block';
                error.textContent = result.message || 'Failed to save post';
            }
        } catch (err) {
            error.style.display = 'block';
            error.textContent = 'Error: ' + err.message;
        }
        loading.style.display = 'none';
    });

    // Load Posts
    async function loadPosts() {
        loading.style.display = 'block';
        error.style.display = 'none';
        try {
            const response = await fetch('/api/list-posts', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` }
            });
            const posts = await response.json();
            postList.innerHTML = '';
            posts.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(post => {
                const postElement = document.createElement('article');
                postElement.className = 'blog-post';
                postElement.innerHTML = `
                    <div class="post-content">
                        <h3 class="post-title">${post.title}</h3>
                        <div class="post-meta">
                            <time>${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                            <span class="post-category">${post.category}</span>
                        </div>
                        <form class="edit-post">
                            <input type="hidden" name="slug" value="${post.slug}">
                            <label>Title: <input type="text" name="title" value="${post.title}" required></label><br>
                            <label>Category: <input type="text" name="category" value="${post.category}" required></label><br>
                            <label>Tags: <input type="text" name="tags" value="${post.tags?.join(', ')}"></label><br>
                            <label>Image URL: <input type="text" name="image" value="${post.image}"></label><br>
                            <label>Image Upload: <input type="file" name="image-file" accept="image/*"></label><br>
                            <label>Date: <input type="date" name="date" value="${post.date}" required></label><br>
                            <label>Content:<br><textarea name="content" rows="10">${post.content}</textarea></label><br>
                            <button type="submit" class="btn-primary">Update Post</button>
                            <button type="button" class="btn-primary delete-post">Delete Post</button>
                        </form>
                    </div>
                `;
                postList.appendChild(postElement);
            });

            // Edit Post
            document.querySelectorAll('.edit-post').forEach(form => {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
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
                            error.style.display = 'block';
                            error.textContent = uploadResult.message || 'Image upload failed';
                            loading.style.display = 'none';
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
                        const response = await fetch('/api/storesubmission', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
                            body: JSON.stringify(postData)
                        });
                        if (response.ok) {
                            loadPosts();
                        } else {
                            error.style.display = 'block';
                            error.textContent = 'Failed to update post';
                        }
                    } catch (err) {
                        error.style.display = 'block';
                        error.textContent = 'Error: ' + err.message;
                    }
                    loading.style.display = 'none';
                });
            });

            // Delete Post
            document.querySelectorAll('.delete-post').forEach(button => {
                button.addEventListener('click', async () => {
                    if (!confirm('Are you sure you want to delete this post?')) return;
                    const slug = button.closest('form').querySelector('[name="slug"]').value;
                    try {
                        const response = await fetch('/api/storesubmission', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
                            body: JSON.stringify({ slug })
                        });
                        if (response.ok) {
                            loadPosts();
                        } else {
                            error.style.display = 'block';
                            error.textContent = 'Failed to delete post';
                        }
                    } catch (err) {
                        error.style.display = 'block';
                        error.textContent = 'Error: ' + err.message;
                    }
                    loading.style.display = 'none';
                });
            });
        } catch (err) {
            error.style.display = 'block';
            error.textContent = 'Error loading posts: ' + err.message;
            loading.style.display = 'none';
        }
    }
});