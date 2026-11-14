
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Common email validation
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common password validation
const passwordPattern = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.user_id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1d'
        }
    );
};

// Store Owner Registration
exports.register = async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                message: 'Full name, email and password are required.'
            });
        }

        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                message: 'Please enter a valid email address.'
            });
        }

        if (!passwordPattern.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters, one number and one special character.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            `INSERT INTO users
            (full_name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, ?)`,
            [
                full_name.trim(),
                email.trim().toLowerCase(),
                phone ? phone.trim() : null,
                passwordHash,
                'store_owner'
            ]
        );

        res.status(201).json({
            message: 'Store Owner registered successfully!',
            user: {
                user_id: result.insertId,
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                role: 'store_owner'
            }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'This email or phone number is already registered.'
            });
        }

        console.error('Registration error:', error.message);

        res.status(500).json({
            message: 'Registration failed. Please try again.'
        });
    }
};


// Store Owner Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const [users] = await pool.execute(
            `SELECT user_id, full_name, email, phone,
                    password_hash, role, is_active
             FROM users
             WHERE email = ? AND role = ?`,
            [email.trim().toLowerCase(), 'store_owner']
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                message: 'Your account is inactive. Please contact support.'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        res.status(500).json({
            message: 'Login failed. Please try again.'
        });
    }
};


// Customer Registration
exports.registerCustomer = async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        if (!full_name || !email || !phone || !password) {
            return res.status(400).json({
                message: 'Full name, email, phone number and password are required.'
            });
        }

        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                message: 'Please enter a valid email address.'
            });
        }

        if (!/^\d{10}$/.test(phone.trim())) {
            return res.status(400).json({
                message: 'Please enter a valid 10-digit phone number.'
            });
        }

        if (!passwordPattern.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters, one number and one special character.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            `INSERT INTO users
            (full_name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, ?)`,
            [
                full_name.trim(),
                email.trim().toLowerCase(),
                phone.trim(),
                passwordHash,
                'customer'
            ]
        );

        res.status(201).json({
            message: 'Customer registered successfully!',
            user: {
                user_id: result.insertId,
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                role: 'customer'
            }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'This email or phone number is already registered.'
            });
        }

        console.error('Customer registration error:', error.message);

        res.status(500).json({
            message: 'Customer registration failed. Please try again.'
        });
    }
};


// Customer Login
exports.loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const [users] = await pool.execute(
            `SELECT user_id, full_name, email, phone,
                    password_hash, role, is_active
             FROM users
             WHERE email = ? AND role = ?`,
            [email.trim().toLowerCase(), 'customer']
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                message: 'Your account is inactive. Please contact support.'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Customer login successful!',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Customer login error:', error.message);

        res.status(500).json({
            message: 'Customer login failed. Please try again.'
        });
    }
};
