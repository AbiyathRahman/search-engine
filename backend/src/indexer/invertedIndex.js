const { getDb } = require('../services/db');
const { ObjectId } = require('mongodb');

class InvertedIndex {
    constructor() {
        this.db = getDb();
        this.indexCollection = this.db.collection('index');
        this.pagesCollection = this.db.collection('pages');
    }
    // Build inverted index for a single page
    async indexPage(page, termFrequencies, positions) {
        const pageId = page._id;

        // Use bulkWrite for efficient batch operations
        const operations = [];

        for (const [term, frequency] of Object.entries(termFrequencies)) {
            operations.push(
                {
                    updateOne: {
                        filter: { term },
                        update: [
                            {
                                $set: {
                                    term: term,
                                    postings: {
                                        $concatArrays: [
                                            { $ifNull: ["$postings", []] },
                                            [{ pageId, frequency, positions: positions[term] || [] }]
                                        ]
                                    },
                                    documentFrequency: {
                                        $add: [{ $ifNull: ["$documentFrequency", 0] }, 1]
                                    }
                                }
                            }
                        ],
                        upsert: true
                    }
                }
            );
        }

        // Execute all operations in batch
        if (operations.length > 0) {
            await this.indexCollection.bulkWrite(operations);
        }

        // Mark page as indexed
        await this.pagesCollection.updateOne(
            { _id: pageId },
            {
                $set: {
                    indexed: true,
                    indexedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }

    // Build index for all unindexed pages

    async buildIndex() {
        console.log('\nBuilding inverted index...\n');

        const Tokenizer = require('./tokenizer');
        const tokenizer = new Tokenizer();

        // Get all unindexed pages
        const unindexedPages = await this.pagesCollection.find({ indexed: false }).toArray();
        console.log(`Found ${unindexedPages.length} pages to index`);

        let indexedCount = 0;

        for (let i = 0; i < unindexedPages.length; i++) {
            const page = unindexedPages[i];
            try {
                console.log(`[${i + 1}/${unindexedPages.length}] Processing: ${page.url.substring(0, 40)}`);

                if (!page.content) {
                    console.log(`  → Skipped (no content)`);
                    continue;
                }

                const { words, positions } = tokenizer.tokenizeWithPositions(page.content);
                const termFrequencies = {};
                words.forEach(word => {
                    termFrequencies[word] = (termFrequencies[word] || 0) + 1;
                });

                console.log(`  → Indexing ${Object.keys(termFrequencies).length} unique terms...`);
                await this.indexPage(page, termFrequencies, positions);
                console.log(`  ✓ Complete`);
                indexedCount++;

                if (indexedCount % 5 === 0) {
                    console.log(`Progress: ${indexedCount}/${unindexedPages.length} pages indexed\n`);
                }
            } catch (error) {
                console.error(`  ✗ Error on page ${page._id}:`, error.message);
            }
        }

        console.log(`\n✓ Indexed ${indexedCount} pages. Inverted index build complete.\n`);
        return indexedCount;
    }

    async getStats() {
        const totalTerms = await this.indexCollection.countDocuments();
        const totalPages = await this.pagesCollection.countDocuments({ indexed: true });

        const sampleTerms = await this.indexCollection.find().limit(5).toArray();
        return {
            totalTerms,
            totalPages,
            sampleTerms: sampleTerms.map(t => ({
                term: t.term,
                documentFrequency: t.documentFrequency,
            }))
        };
    }
}

module.exports = InvertedIndex;