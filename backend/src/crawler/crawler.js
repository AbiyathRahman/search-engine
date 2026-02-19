const { getDb } = require('../services/db');
const URLFrontier = require('./urlFrontier');
const Parser = require('./parser');

class Crawler {
    constructor(options = {}) {
        this.maxPages = options.maxPages || 100;
        this.delay = options.delay || 1000; // Delay between requests in ms
        this.frontier = new URLFrontier();
        this.parser = new Parser();
        this.crawlCount = 0;
    }

    intit(seedUrls) {
        console.log(`\nInitializing crawler with ${seedUrls.length} seed URLs...`);
        seedUrls.forEach(url => {
            this.frontier.enqueue(url, 10); // High priority for seed urls
        });
    }

    async start() {
        console.log(`\nStarting Crawl (max ${this.maxPages} pages)...`);
        while (!this.frontier.isEmpty() && this.crawlCount < this.maxPages) {
            const url = this.frontier.dequeue();
            if (!url) break;

            try {
                await this.crawlPage(url);
                this.crawlCount++;

                if (this.crawlCount % 10 === 0) {
                    const stats = this.frontier.getStats();
                    console.log(`Progress: ${this.crawlCount}/${this.maxPages} pages crawled, Queue size: ${stats.queueSize}`);
                }
                await this.sleep(this.delay);
            } catch (err) {
                console.error(`Error crawling ${url}:`, err.message);
                return this.crawlCount;
            }
        }
    }

    async crawlPage(url) {
        const { title, content, snippet } = this.parser.extractText(html);
        const links = this.parser.extractLinks(html, url);

        await this.storePage({
            url,
            title,
            content,
            snippet,
            outgoingLinks: links,
            crawledAt: new Date(),
            indexed: false
        });

        links.forEach(link => {
            if (this.parser.isValidURL(link)) {
                this.frontier.enqueue(link, 1); // Normal priority for discovered links
            }
        });

        console.log(`Crawled: ${title.substring(0, 50)}... (${links.length} links)`);
    }

    async storePage(pageData) {
        const db = getDb();
        const pagesCollection = db.collection('pages');

        try {
            await pagesCollection.insertOne({
                ...pageData,
                crawledAt: new Date(),
                updatedAt: new Date()
            });
        } catch (err) {
            if (err.code === 11000) {
                console.log(`Page already exists in DB: ${pageData.url}`);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = Crawler;