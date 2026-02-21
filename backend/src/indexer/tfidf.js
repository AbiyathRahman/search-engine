const { getDb } = require('../services/db');

class TFIDF {
    constructor() {
        this.db = getDb();
        this.indexCollection = this.db.collection('index');
        this.pagesCollection = this.db.collection('pages');
    }

    // Calculate TF (Term frequency)
    calculateTF(termFrequencies, totalTermsInDocument) {
        return termFrequencies / totalTermsInDocument;
    }

    // Calculate IDF (Inverse Document Frequency)
    calculateIDF(totalDocuments, documentsContainingTerm) {
        if (documentsContainingTerm === 0) {
            return 0; // Avoid division by zero, term not in any document
        }
        return Math.log(totalDocuments / documentsContainingTerm);
    }

    // Calculate TF-IDF for all terms in index
    async calculateALLTFIDF() {
        console.log('Calculating TF-IDF for all terms in index...');

        // Get total number of documents
        const totalDocs = await this.pagesCollection.countDocuments({ indexed: true });
        console.log(`Total indexed documents: ${totalDocs}`);

        // Fetch all pages once and cache them
        const allPages = await this.pagesCollection.find({ indexed: true }).toArray();
        const pageCache = {};
        allPages.forEach(page => {
            pageCache[page._id.toString()] = page;
        });
        console.log(`Cached ${allPages.length} pages`);

        // Get all index entries
        const allIndexEntries = await this.indexCollection.find().toArray();
        console.log(`Total unique terms in index: ${allIndexEntries.length}`);

        let processedTerms = 0;

        for (const indexEntry of allIndexEntries) {
            try {
                // Safety check: ensure postings is an array
                if (!indexEntry.postings || !Array.isArray(indexEntry.postings)) {
                    console.warn(`Warning: postings for term "${indexEntry.term}" is not a valid array. Skipping.`);
                    continue;
                }

                // Calculate TF-IDF for all postings in this term
                for (const posting of indexEntry.postings) {
                    // Get the page from cache
                    const page = pageCache[posting.pageId.toString()];
                    if (!page) continue; // Skip if page not found

                    // Count total words in document
                    const totalWords = page.content.split(/\W+/).filter(w => w.length >= 2).length;

                    // Calculate TF
                    const tf = this.calculateTF(posting.frequency, totalWords);

                    // Calculate IDF
                    const idf = this.calculateIDF(totalDocs, indexEntry.documentFrequency);

                    // Calculate TF-IDF
                    posting.tfidf = tf * idf;
                }

                // Update the index entry once with all TF-IDF scores calculated
                await this.indexCollection.updateOne(
                    { _id: indexEntry._id },
                    { $set: { postings: indexEntry.postings } }
                );

                processedTerms++;

                if (processedTerms % 100 === 0) {
                    console.log(`Processed ${processedTerms}/${allIndexEntries.length} terms`)
                }

            } catch (error) {
                console.error(`Error processing term ${indexEntry.term}:`, error.message);
            }
        }
        console.log(`TF-IDF calculation completed. Processed ${processedTerms} terms.`);
        return processedTerms;
    }

    async getTopTerms(limit = 10) {
        const allTerms = await this.indexCollection.find().toArray();
        const termScores = allTerms
            .filter(term => Array.isArray(term.postings) && term.postings.length > 0)
            .map(term => {
                // Calculate average tf-idf across all documents containing the term
                const avgTFIDF = term.postings.reduce((sum, p) => sum + (p.tfidf || 0), 0) / term.postings.length;

                return {
                    term: term.term,
                    avgTFIDF,
                    documentFrequency: term.documentFrequency
                };
            });

        // Sort terms by average TF-IDF score in descending order
        termScores.sort((a, b) => b.avgTFIDF - a.avgTFIDF);
        return termScores.slice(0, limit);
    }


}

module.exports = TFIDF;