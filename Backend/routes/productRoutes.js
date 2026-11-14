
const express = require('express');
const router = express.Router();

const {
    getCategories,
    createCategory,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByStore
} = require('../controllers/productController');

const verifyToken = require('../middleware/authMiddleware');

// Customer: Get products from a selected store
router.get('/store/:store_id', getProductsByStore);

// Store Owner: Category routes
router.get('/categories', verifyToken, getCategories);
router.post('/categories', verifyToken, createCategory);

// Store Owner: Product routes
router.get('/', verifyToken, getProducts);
router.post('/', verifyToken, createProduct);
router.put('/:product_id', verifyToken, updateProduct);
router.delete('/:product_id', verifyToken, deleteProduct);

module.exports = router;
