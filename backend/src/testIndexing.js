const { connectToDatabase, closeConnection } = require('./services/db');
const InvertedIndex = require('./indexer/invertedIndex');
const TFIDF = require('./indexer/tfidf');

async function runIndexing() {
    try {
        console.log('Starting indexing process...\n');

        // Connect to DB
        await connectToDatabase();

        // Step 1: Build inverted index
        const indexBuilder = new InvertedIndex();
        await indexBuilder.buildIndex();

        // Show index stats
        const stats = await indexBuilder.getStats();
        console.log('\n📊 Index Statistics:');
        console.log(`   Total unique terms: ${stats.totalTerms}`);
        console.log(`   Total indexed pages: ${stats.totalPages}`);
        console.log('\n   Sample terms:');
        stats.sampleTerms.forEach(t => {
            console.log(`   - "${t.term}" appears in ${t.documentFrequency} documents`);
        });

        // Step 2: Calculate TF-IDF scores
        const tfidfCalculator = new TFIDF();
        await tfidfCalculator.calculateALLTFIDF();

        // Show top terms
        const topTerms = await tfidfCalculator.getTopTerms(10);
        console.log('\n🏆 Top 10 terms by average TF-IDF:');
        topTerms.forEach((term, index) => {
            console.log(`   ${index + 1}. "${term.term}" - Score: ${term.avgTFIDF.toFixed(4)} (in ${term.documentFrequency} docs)`);
        });

        // Close connection
        await closeConnection();

        console.log('\n✅ Indexing complete!');
    } catch (error) {
        console.error('Indexing failed:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

runIndexing();