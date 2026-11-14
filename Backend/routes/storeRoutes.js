
const express = require('express');
const router = express.Router();

const {
    createStore,
    getMyStore,
    updateMyStore,
    getAllStores
} = require('../controllers/storeController');

const verifyToken = require('../middleware/authMiddleware');

// Customer: Get all registered stores
router.get('/', getAllStores);

// Store Owner: Register a store
router.post('/', verifyToken, createStore);

// Store Owner: Get own store
router.get('/my-store', verifyToken, getMyStore);

// Store Owner: Update own store
router.put('/my-store', verifyToken, updateMyStore);

module.exports = router;
