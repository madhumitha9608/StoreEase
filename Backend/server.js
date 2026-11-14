require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
    res.json({
        message: 'StoreEase Backend is running successfully!'
    });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
    try {
        const [result] = await pool.query(
            'SELECT DATABASE() AS database_name'
        );

        res.json({
            message: 'MySQL connected successfully!',
            database: result[0].database_name
        });
    } catch (error) {
        console.error('Database test failed:', error.message);

        res.status(500).json({
            message: 'Database connection failed'
        });
    }
});

// Authentication routes
app.use('/api/auth', require('./routes/authRoutes'));

// Store routes
app.use('/api/stores', require('./routes/storeRoutes'));

// Product and category routes
app.use('/api/products', require('./routes/productRoutes'));

// Order routes
app.use('/api/orders', require('./routes/orderRoutes'));

// Start server after checking database connection
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await pool.getConnection();

        console.log('MySQL database connected successfully!');

        connection.release();

        app.listen(PORT, () => {
            console.log(
                `StoreEase Backend running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error('Unable to connect to MySQL:', error.message);
        process.exit(1);
    }
}

startServer();