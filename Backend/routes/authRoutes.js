
const express = require('express');
const router = express.Router();

const {
    register,
    login,
    registerCustomer,
    loginCustomer
} = require('../controllers/authController');

// Store Owner Authentication
router.post('/register', register);
router.post('/login', login);

// Customer Authentication
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

module.exports = router;
