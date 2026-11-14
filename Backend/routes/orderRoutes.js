
const express = require('express');
const router = express.Router();

const {
    createCustomerOrder,
    getCustomerOrders,
    getMyOrders,
    updateOrderStatus
} = require('../controllers/orderController');

const verifyToken = require('../middleware/authMiddleware');
const customerAuthMiddleware = require('../middleware/customerAuthMiddleware');

// Customer routes
router.post('/', customerAuthMiddleware, createCustomerOrder);
router.get('/my-orders', customerAuthMiddleware, getCustomerOrders);

// Store Owner routes
router.get('/', verifyToken, getMyOrders);
router.put('/:order_id/status', verifyToken, updateOrderStatus);

module.exports = router;
