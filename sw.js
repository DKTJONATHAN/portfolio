self.addEventListener('fetch', event => {
    if (event.request.url.includes('/api/list-posts')) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(fetchResponse => {
                    caches.open('blog-cache').then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                    });
                    return fetchResponse;
                });
            })
        );
    }
});