class URLFrontier {
    constructor() {
        this.queue = [];
        this.visited = new Set();
        this.inQueue = new Set();
    }

    // Add URL to queue
    enqueue(url, priority = 0) {
        url = this.normalizeURL(url);
        if (this.visited.has(url) || this.inQueue.has(url)) {
            return false;
        }
        this.queue.push({ url, priority });
        this.inQueue.add(url);
        this.queue.sort((a, b) => b.priority - a.priority); // Sort by priority
        return true;
    }
    // Get next URL to crawl
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        const item = this.queue.shift();
        this.inQueue.delete(item.url);
        this.visited.add(item.url);
        return item.url;
    }

    // Check if queue is empty
    isEmpty() {
        return this.queue.length === 0;
    }

    // Get size of the queue
    size() {
        return this.queue.length;
    }

    // Normalize URL (remove trailing slash, etc.)
    normalizeURL(url) {
        try {
            const urlObj = new URL(url);
            // Remove fragment, trailing slash
            return urlObj.origin + urlObj.pathname.replace(/\/$/, '') + urlObj.search;
        } catch (e) {
            return url; // Return as is if invalid URL
        }
    }

    // Check if url was visited
    hasVisited(url) {
        return this.visited.has(this.normalizeURL(url));
    }

    // Get Stats
    getStats() {
        return {
            queueSize: this.queue.length,
            visitedCount: this.visited.size,
            totalProcessed: this.visited.size
        };
    }
}

module.exports = URLFrontier;