
const pool = require('../config/db');

// CUSTOMER: Create a new order
exports.createCustomerOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const customer_user_id = req.user.userId;
        const { store_id, items, delivery_method, delivery_address } = req.body;

        if (!store_id || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Store and order items are required.'
            });
        }

        if (!['pickup', 'delivery'].includes(delivery_method)) {
            return res.status(400).json({
                message: 'Choose pickup or delivery.'
            });
        }

        await connection.beginTransaction();

        let subtotal = 0;
        const orderItems = [];

        // Check each product and its stock
        for (const item of items) {
            const product_id = Number(item.product_id);
            const quantity = Number(item.quantity);

            if (!Number.isInteger(product_id) ||
                !Number.isInteger(quantity) || quantity <= 0) {
                throw new Error('Invalid product or quantity.');
            }

            const [products] = await connection.execute(
                `SELECT *
                 FROM products
                 WHERE product_id = ?
                 AND store_id = ?
                 AND is_active = 1
                 FOR UPDATE`,
                [product_id, store_id]
            );

            if (products.length === 0) {
                throw new Error('A selected product is unavailable.');
            }

            const product = products[0];

            if (quantity > Number(product.available_quantity)) {
                throw new Error(
                    `Insufficient stock for ${product.product_name || product.name || 'a product'}.`
                );
            }

            const price = Number(product.price);
            const product_name =
                product.product_name || product.name || product.title;

            if (!product_name || !Number.isFinite(price) || price < 0) {
                throw new Error('Product information is incomplete.');
            }

            const itemSubtotal = price * quantity;
            subtotal += itemSubtotal;

            orderItems.push({
                product_id,
                product_name,
                quantity,
                price,
                subtotal: itemSubtotal
            });
        }

        // Delivery is available only for orders of ₹1,000 or more
        if (subtotal < 1000 && delivery_method === 'delivery') {
            throw new Error(
                'Delivery is available only for orders of ₹1,000 or more. Please choose pickup.'
            );
        }

        if (delivery_method === 'delivery' && !delivery_address?.trim()) {
            throw new Error('Please provide a delivery address.');
        }

        // Distance-based delivery charge will be connected with map routing.
        const delivery_charge = 0;
        const total_amount = subtotal + delivery_charge;

        const [orderResult] = await connection.execute(
            `INSERT INTO orders
             (
                customer_user_id,
                store_id,
                total_amount,
                payment_method,
                payment_status,
                order_status,
                delivery_method,
                delivery_address,
                delivery_distance_km,
                delivery_charge
             )
             VALUES (?, ?, ?, 'online', 'pending', 'placed', ?, ?, NULL, ?)`,
            [
                customer_user_id,
                store_id,
                total_amount,
                delivery_method,
                delivery_method === 'delivery' ? delivery_address : null,
                delivery_charge
            ]
        );

        const order_id = orderResult.insertId;

        // Save order items and reduce stock
        for (const item of orderItems) {
            await connection.execute(
                `INSERT INTO order_items
                 (order_id, product_id, product_name, quantity, unit_price, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    order_id,
                    item.product_id,
                    item.product_name,
                    item.quantity,
                    item.price,
                    item.subtotal
                ]
            );

            await connection.execute(
                `UPDATE products
                 SET available_quantity = available_quantity - ?
                 WHERE product_id = ?`,
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: 'Order placed successfully!',
            order_id,
            total_amount,
            payment_status: 'pending',
            order_status: 'placed',
            delivery_method,
            delivery_charge
        });

    } catch (error) {
        await connection.rollback();

        console.error('Order creation error:', error.message);

        res.status(400).json({
            message: error.message || 'Unable to place order.'
        });

    } finally {
        connection.release();
    }
};


// CUSTOMER: Get orders belonging to the logged-in customer
exports.getCustomerOrders = async (req, res) => {
    try {
        const customer_user_id = req.user.userId;

        const [orders] = await pool.execute(
            `SELECT
                o.order_id,
                o.store_id,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.delivery_method,
                o.delivery_address,
                o.delivery_distance_km,
                o.delivery_charge,
                o.created_at,
                oi.order_item_id,
                oi.product_id,
                oi.product_name,
                oi.quantity,
                oi.unit_price,
                oi.subtotal
             FROM orders o
             LEFT JOIN order_items oi
                ON o.order_id = oi.order_id
             WHERE o.customer_user_id = ?
             ORDER BY o.created_at DESC`,
            [customer_user_id]
        );

        res.status(200).json({ orders });

    } catch (error) {
        console.error('Customer order retrieval error:', error.message);

        res.status(500).json({
            message: 'Unable to retrieve your orders.'
        });
    }
};


// STORE OWNER: Get all orders belonging to the logged-in store owner
exports.getMyOrders = async (req, res) => {
    try {
        const owner_user_id = req.user.userId;

        const [stores] = await pool.execute(
            'SELECT store_id FROM stores WHERE owner_user_id = ?',
            [owner_user_id]
        );

        if (stores.length === 0) {
            return res.status(404).json({
                message: 'Store not found.'
            });
        }

        const store_id = stores[0].store_id;

        const [orders] = await pool.execute(
            `SELECT
                o.order_id,
                o.customer_user_id,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.delivery_method,
                o.delivery_address,
                o.delivery_distance_km,
                o.delivery_charge,
                o.created_at,
                oi.order_item_id,
                oi.product_id,
                oi.product_name,
                oi.quantity,
                oi.unit_price,
                oi.subtotal
             FROM orders o
             LEFT JOIN order_items oi
                ON o.order_id = oi.order_id
             WHERE o.store_id = ?
             ORDER BY o.created_at DESC`,
            [store_id]
        );

        res.status(200).json({ orders });

    } catch (error) {
        console.error('Order retrieval error:', error.message);

        res.status(500).json({
            message: 'Unable to retrieve orders.'
        });
    }
};


// STORE OWNER: Update an order's status
exports.updateOrderStatus = async (req, res) => {
    try {
        const owner_user_id = req.user.userId;
        const { order_id } = req.params;
        const { order_status } = req.body;

        const allowedStatuses = [
            'confirmed',
            'preparing',
            'ready_for_pickup',
            'out_for_delivery',
            'delivered',
            'cancelled'
        ];

        if (!allowedStatuses.includes(order_status)) {
            return res.status(400).json({
                message: 'Invalid order status.'
            });
        }

        const [orders] = await pool.execute(
            `SELECT o.order_id
             FROM orders o
             INNER JOIN stores s
                ON o.store_id = s.store_id
             WHERE o.order_id = ?
             AND s.owner_user_id = ?`,
            [order_id, owner_user_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'Order not found.'
            });
        }

        await pool.execute(
            `UPDATE orders
             SET order_status = ?
             WHERE order_id = ?`,
            [order_status, order_id]
        );

        res.status(200).json({
            message: 'Order status updated successfully!'
        });

    } catch (error) {
        console.error('Order update error:', error.message);

        res.status(500).json({
            message: 'Unable to update order status.'
        });
    }
};
