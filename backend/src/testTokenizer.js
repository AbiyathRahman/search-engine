const Tokenizer = require('./indexer/tokenizer');

// Test tokenization
const tokenizer = new Tokenizer();

const testText = `
  Machine Learning is a subset of Artificial Intelligence. 
  Machine learning algorithms build models based on sample data.
`;

console.log('Original text:');
console.log(testText);

console.log('\n--- Tokenization Results ---\n');

// Basic tokenization
const words = tokenizer.tokenize(testText);
console.log('Tokens:', words);
console.log('Total tokens:', words.length);

// With positions
const { words: wordsWithPos, positions } = tokenizer.tokenizeWithPositions(testText);
console.log('\nTokens with positions:', wordsWithPos);
console.log('\nPositions:');
Object.entries(positions).forEach(([word, pos]) => {
    console.log(`  "${word}" at positions: ${pos.join(', ')}`);
});

// Term frequencies
const frequencies = tokenizer.getTermFrequencies(testText);
console.log('\nTerm frequencies:');
Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1])
    .forEach(([word, freq]) => {
        console.log(`  "${word}": ${freq}`);
    });