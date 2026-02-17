const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./services/db');
const app = express();

const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
})

async function startServer() {
    try {
        // Connect to MongoDB first
        await connectToDatabase();

        app.listen(port, () => {
            console.log(`✓ Server running on http://localhost:${port}`);
            console.log(`✓ Health check: http://localhost:${port}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();