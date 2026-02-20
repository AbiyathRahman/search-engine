class Tokenizer {
    constructor() {
        this.stopWords = new Set([
            'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
            'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
            'between', 'both', 'but', 'by', 'can', 'cannot', 'could', 'did', 'do', 'does',
            'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
            'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
            'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
            'just', 'me', 'might', 'more', 'most', 'must', 'my', 'myself', 'no', 'nor',
            'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
            'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
            'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
            'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
            'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
            'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your',
            'yours', 'yourself', 'yourselves'
        ]);
    }

    tokenize(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }
        //Step 1: convert to lower case
        text = text.toLowerCase();

        // Step 2: split on non=alphanumeric characters
        let words = text.split(/\W+/);

        // Step 3: Filter outempty string and short words
        words = words.filter(word => word.length >= 2);

        // Step 4: Remove stop words
        words = words.filter(word => !this.stopWords.has(word));
        return words;
    }

    // Tokenize and track positions (for phrase search later)
    tokenizeWithPositions(text) {
        if (!text || typeof text !== 'string') {
            return { words: [], positions: {} };
        }
        text = text.toLowerCase();
        const words = text.split(/\W+/).filter(w => w.length >= 2);
        const positions = {};
        const filteredWords = [];

        words.forEach((word, index) => {
            if (!this.stopWords.has(word)) {
                filteredWords.push(word);
                if (!positions[word]) {
                    positions[word] = [];
                }
                positions[word].push(index);
            }
        });
        return { words: filteredWords, positions };
    }
    // Count word frequencies
    getTermFrequencies(text) {
        const words = this.tokenize(text);
        const frequencies = {};

        words.forEach(word => {
            frequencies[word] = (frequencies[word] || 0) + 1;
        });
        return frequencies;
    }

    // Get Unique terms
    getUniqueTerms(text) {
        const words = this.tokenize(text);
        return [...new Set(words)];
    }
}
module.exports = Tokenizer;