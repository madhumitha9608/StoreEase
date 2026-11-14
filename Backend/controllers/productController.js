
const pool = require('../config/db');

// Get the logged-in owner's store ID
const getStoreId = async (owner_user_id) => {
    const [stores] = await pool.execute(
        'SELECT store_id FROM stores WHERE owner_user_id = ?',
        [owner_user_id]
    );

    return stores.length > 0 ? stores[0].store_id : null;
};

// Validate product details
const validateProduct = (data, isUpdate = false) => {
    const {
        category_id,
        product_name,
        price,
        mrp,
        initial_stock,
        available_quantity
    } = data;

    if (
        !category_id ||
        !product_name?.trim() ||
        price === undefined ||
        price === ''
    ) {
        return 'Category, product name and selling price are required.';
    }

    if (
        !Number.isInteger(Number(category_id)) ||
        Number(category_id) <= 0 ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
    ) {
        return 'Enter a valid category and selling price.';
    }

    if (
        mrp !== undefined &&
        mrp !== null &&
        mrp !== '' &&
        (
            !Number.isFinite(Number(mrp)) ||
            Number(mrp) < Number(price)
        )
    ) {
        return 'MRP must be greater than or equal to the selling price.';
    }

    if (
        initial_stock === undefined ||
        !Number.isInteger(Number(initial_stock)) ||
        Number(initial_stock) < 0
    ) {
        return 'Enter a valid initial stock quantity.';
    }

    if (
        isUpdate &&
        (
            available_quantity === undefined ||
            !Number.isInteger(Number(available_quantity)) ||
            Number(available_quantity) < 0 ||
            Number(available_quantity) > Number(initial_stock)
        )
    ) {
        return 'Enter a valid available stock quantity.';
    }

    return null;
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const store_id = await getStoreId(req.user.userId);

        if (!store_id) {
            return res.status(404).json({
                message: 'Store not found.'
            });
        }

        const [categories] = await pool.execute(
            `SELECT * FROM categories
             WHERE store_id = ?
             ORDER BY category_name`,
            [store_id]
        );

        res.status(200).json({ categories });

    } catch (error) {
        console.error('Get categories error:', error.message);

        res.status(500).json({
            message: 'Unable to retrieve categories.'
        });
    }
};

// Create a category or subcategory
exports.createCategory = async (req, res) => {
    try {
        const { category_name, parent_category_id } = req.body;

        if (!category_name?.trim()) {
            return res.status(400).json({
                message: 'Category name is required.'
            });
        }

        const store_id = await getStoreId(req.user.userId);

        if (!store_id) {
            return res.status(404).json({
                message: 'Store not found.'
            });
        }

        if (parent_category_id) {
            const [parent] = await pool.execute(
                `SELECT category_id FROM categories
                 WHERE category_id = ? AND store_id = ?`,
                [parent_category_id, store_id]
            );

            if (parent.length === 0) {
                return res.status(400).json({
                    message: 'Invalid parent category.'
                });
            }
        }

        const [result] = await pool.execute(
            `INSERT INTO categories
             (store_id, parent_category_id, category_name)
             VALUES (?, ?, ?)`,
            [
                store_id,
                parent_category_id || null,
                category_name.trim()
            ]
        );

        res.status(201).json({
            message: 'Category created successfully!',
            category_id: result.insertId
        });

    } catch (error) {
        console.error('Create category error:', error.message);

        res.status(500).json({
            message: 'Unable to create category.'
        });
    }
};

// Get all active products
exports.getProducts = async (req, res) => {
    try {
        const store_id = await getStoreId(req.user.userId);

        if (!store_id) {
            return res.status(404).json({
                message: 'Store not found.'
            });
        }

        const [products] = await pool.execute(
            `SELECT p.*, c.category_name
             FROM products p
             JOIN categories c ON p.category_id = c.category_id
             WHERE p.store_id = ? AND p.is_active = 1
             ORDER BY p.created_at DESC`,
            [store_id]
        );

        res.status(200).json({ products });

    } catch (error) {
        console.error('Get products error:', error.message);

        res.status(500).json({
            message: 'Unable to retrieve products.'
        });
    }
};

// Add a product
exports.createProduct = async (req, res) => {
    try {
        const {
            category_id,
            product_name,
            brand,
            unit_label,
            description,
            mrp,
            price,
            initial_stock,
            available_quantity,
            product_image
        } = req.body;

        const validationError = validateProduct(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const store_id = await getStoreId(req.user.userId);

        if (!store_id) {
            return res.status(404).json({
                message: 'Store not found.'
            });
        }

        const [categories] = await pool.execute(
            `SELECT category_id FROM categories
             WHERE category_id = ? AND store_id = ?`,
            [category_id, store_id]
        );

        if (categories.length === 0) {
            return res.status(400).json({
                message: 'Invalid category.'
            });
        }

        const stock = Number(initial_stock);

        const [result] = await pool.execute(
            `INSERT INTO products
             (store_id, category_id, product_name, brand,
              unit_label, description, price, mrp,
              initial_stock, available_quantity, product_image)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                store_id,
                Number(category_id),
                product_name.trim(),
                brand?.trim() || null,
                unit_label?.trim() || null,
                description?.trim() || null,
                Number(price),
                mrp === undefined || mrp === null || mrp === ''
                    ? null
                    : Number(mrp),
                stock,
                available_quantity === undefined
                    ? stock
                    : Number(available_quantity),
                product_image || null
            ]
        );

        res.status(201).json({
            message: 'Product added successfully!',
            product_id: result.insertId
        });

    } catch (error) {
        console.error('Create product error:', error.message);

        res.status(500).json({
            message: 'Unable to add product.'
        });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    try {
        const { product_id } = req.params;

        const {
            category_id,
            product_name,
            brand,
            unit_label,
            description,
            mrp,
            price,
            initial_stock,
            available_quantity,
            product_image
        } = req.body;

        const validationError = validateProduct(req.body, true);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const store_id = await getStoreId(req.user.userId);

        if (!store_id) {
            return res.status(404).json({
                message: 'Store not found.'
            });
        }

        const [categories] = await pool.execute(
            `SELECT category_id FROM categories
             WHERE category_id = ? AND store_id = ?`,
            [category_id, store_id]
        );

        if (categories.length === 0) {
            return res.status(400).json({
                message: 'Invalid category.'
            });
        }

        const [existingProduct] = await pool.execute(
            `SELECT product_id FROM products
             WHERE product_id = ? AND store_id = ? AND is_active = 1`,
            [product_id, store_id]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        await pool.execute(
            `UPDATE products
             SET category_id = ?,
                 product_name = ?,
                 brand = ?,
                 unit_label = ?,
                 description = ?,
                 price = ?,
                 mrp = ?,
                 initial_stock = ?,
                 available_quantity = ?,
                 product_image = ?
             WHERE product_id = ? AND store_id = ?`,
            [
                Number(category_id),
                product_name.trim(),
                brand?.trim() || null,
                unit_label?.trim() || null,
                description?.trim() || null,
                Number(price),
                mrp === undefined || mrp === null || mrp === ''
                    ? null
                    : Number(mrp),
                Number(initial_stock),
                Number(available_quantity),
                product_image || null,
                product_id,
                store_id
            ]
        );

        res.status(200).json({
            message: 'Product updated successfully!'
        });

    } catch (error) {
        console.error('Update product error:', error.message);

        res.status(500).json({
            message: 'Unable to update product.'
        });
    }
};

// Delete a product (soft delete)
exports.deleteProduct = async (req, res) => {
    try {
        const store_id = await getStoreId(req.user.userId);
        const { product_id } = req.params;

        if (!store_id) {
            return res.status(404).json({
                message: 'Store not found.'
            });
        }

        const [result] = await pool.execute(
            `UPDATE products
             SET is_active = 0
             WHERE product_id = ? AND store_id = ? AND is_active = 1`,
            [product_id, store_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        res.status(200).json({
            message: 'Product removed successfully!'
        });

    } catch (error) {
        console.error('Delete product error:', error.message);

        res.status(500).json({
            message: 'Unable to remove product.'
        });
    }
};


// Get products belonging to a selected store (Customer App)
exports.getProductsByStore = async (req, res) => {
    try {
        const { store_id } = req.params;

        if (!Number.isInteger(Number(store_id)) || Number(store_id) <= 0) {
            return res.status(400).json({
                message: 'Invalid store ID.'
            });
        }

        const [products] = await pool.execute(
            `SELECT
                p.product_id,
                p.store_id,
                p.category_id,
                p.product_name,
                p.brand,
                p.unit_label,
                p.description,
                p.price,
                p.mrp,
                p.available_quantity,
                p.product_image,
                c.category_name
             FROM products p
             JOIN categories c ON p.category_id = c.category_id
             WHERE p.store_id = ? AND p.is_active = 1
             ORDER BY p.created_at DESC`,
            [Number(store_id)]
        );

        res.status(200).json({ products });

    } catch (error) {
        console.error('Customer products retrieval error:', error.message);

        res.status(500).json({
            message: 'Unable to retrieve store products.'
        });
    }
};

