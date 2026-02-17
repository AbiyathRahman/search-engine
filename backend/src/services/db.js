const path = require('path');
const fs = require('fs');

// Load .env file if it exists (for local development)
const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const uri = process.env.ATLAS_URI;
let _db;
let _client;

async function connectToDatabase() {
    try {
        _client = new MongoClient(uri);
        await _client.connect();
        _db = _client.db('searchEngine');

        // Create indexes for performance
        await _db.collection('pages').createIndex({ url: 1 }, { unique: true });
        await _db.collection('pages').createIndex({ indexed: 1 });
        await _db.collection('pages').createIndex({ title: 'text', content: 'text' });

        console.log('✓ Connected to MongoDB');
        return _db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

function getDb() {
    if (!_db) {
        throw new Error('Database not connected. Call connectToDatabase first.');
    }
    return _db;
}

async function closeConnection() {
    if (_client) {
        await _client.close();
        console.log('MongoDB connection closed');
    }
}

module.exports = { connectToDatabase, getDb, closeConnection };