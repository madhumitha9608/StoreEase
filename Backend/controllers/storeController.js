const pool = require('../config/db');

// Save Store Details
exports.createStore = async (req, res) => {
    try {
        const {
            store_name,
            store_address,
            district,
            latitude,
            longitude,
            store_phone
        } = req.body;

        const owner_user_id = req.user.userId;

        if (!store_name || !store_address || !district) {
            return res.status(400).json({
                message: 'Store name, address and district are required.'
            });
        }

        const [existingStore] = await pool.execute(
            'SELECT store_id FROM stores WHERE owner_user_id = ?',
            [owner_user_id]
        );

        if (existingStore.length > 0) {
            return res.status(409).json({
                message: 'You have already registered a store.'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO stores
            (owner_user_id, store_name, store_address, district,
             latitude, longitude, store_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                owner_user_id,
                store_name.trim(),
                store_address.trim(),
                district.trim(),
                latitude ?? null,
                longitude ?? null,
                store_phone || null
            ]
        );

        res.status(201).json({
            message: 'Store details saved successfully!',
            store_id: result.insertId
        });

    } catch (error) {
        console.error('Store creation error:', error.message);

        res.status(500).json({
            message: 'Unable to save store details.'
        });
    }
};

// Get Store Details
exports.getMyStore = async (req, res) => {
    try {
        const owner_user_id = req.user.userId;

        const [stores] = await pool.execute(
            'SELECT * FROM stores WHERE owner_user_id = ?',
            [owner_user_id]
        );

        if (stores.length === 0) {
            return res.status(404).json({
                message: 'No store details found.'
            });
        }

        res.status(200).json({
            store: stores[0]
        });

    } catch (error) {
        console.error('Store retrieval error:', error.message);

        res.status(500).json({
            message: 'Unable to retrieve store details.'
        });
    }
};

// Update Store Details
exports.updateMyStore = async (req, res) => {
    try {
        const {
            store_name,
            store_address,
            district,
            latitude,
            longitude,
            store_phone
        } = req.body;

        const owner_user_id = req.user.userId;

        if (!store_name?.trim() || !store_address?.trim() || !district?.trim()) {
            return res.status(400).json({
                message: 'Store name, address and district are required.'
            });
        }

        const [existingStore] = await pool.execute(
            'SELECT store_id FROM stores WHERE owner_user_id = ?',
            [owner_user_id]
        );

        if (existingStore.length === 0) {
            return res.status(404).json({
                message: 'Store details not found.'
            });
        }

        await pool.execute(
            `UPDATE stores
             SET store_name = ?,
                 store_address = ?,
                 district = ?,
                 latitude = ?,
                 longitude = ?,
                 store_phone = ?
             WHERE owner_user_id = ?`,
            [
                store_name.trim(),
                store_address.trim(),
                district.trim(),
                latitude ?? null,
                longitude ?? null,
                store_phone || null,
                owner_user_id
            ]
        );

        res.status(200).json({
            message: 'Store details updated successfully!'
        });

    } catch (error) {
        console.error('Store update error:', error.message);

        res.status(500).json({
            message: 'Unable to update store details.'
        });
    }
};


// Get All Registered Stores (Customer App)
exports.getAllStores = async (req, res) => {
    try {
        const [stores] = await pool.execute(
            `SELECT store_id, store_name, store_address, district,
                    latitude, longitude, store_phone
             FROM stores
             ORDER BY store_id DESC`
        );

        res.status(200).json({
            stores: stores
        });

    } catch (error) {
        console.error('All stores retrieval error:', error.message);

        res.status(500).json({
            message: 'Unable to retrieve stores.'
        });
    }
};
