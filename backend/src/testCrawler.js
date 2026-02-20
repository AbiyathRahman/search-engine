const { connectToDatabase, closeConnection } = require('./services/db');
const Crawler = require('./crawler/crawler');

async function runTest() {
    try {
        await connectToDatabase();
        const crawler = new Crawler({ maxPages: 20, delay: 1000 });
        const seedUrls = ['https://www.example.com', 'https://www.wikipedia.org/wiki/Web_crawler', 'https://nodejs.org/en/docs'];

        crawler.init(seedUrls);
        await crawler.start();

        await closeConnection();

        console.log('Test crawl completed successfully.');
    } catch (error) {
        console.error('Error during test crawl:', error);
        process.exit(1);
    }
}

runTest();