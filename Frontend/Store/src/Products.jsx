
import './Products.css';
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api/products';

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categorySaving, setCategorySaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [categoryForm, setCategoryForm] = useState({
        category_name: '',
        parent_category_id: ''
    });

    const emptyForm = {
        category_id: '',
        product_name: '',
        brand: '',
        unit_label: '',
        description: '',
        mrp: '',
        price: '',
        initial_stock: '',
        available_quantity: '',
        product_image: ''
    };

    const [form, setForm] = useState(emptyForm);

    const token = localStorage.getItem('storeeaseToken');

    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const mainCategories = categories.filter(
        (category) => !category.parent_category_id
    );

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const [productResponse, categoryResponse] = await Promise.all([
                fetch(API, { headers }),
                fetch(`${API}/categories`, { headers })
            ]);

            const productData = await productResponse.json();
            const categoryData = await categoryResponse.json();

            if (!productResponse.ok) {
                throw new Error(productData.message || 'Unable to load products.');
            }

            if (!categoryResponse.ok) {
                throw new Error(categoryData.message || 'Unable to load categories.');
            }

            setProducts(productData.products || []);
            setCategories(categoryData.categories || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateForm = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setError('');
        setMessage('');
    };

    const openAddForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
        setError('');
        setMessage('');
    };

    const openEditForm = (product) => {
        setEditingId(product.product_id);

        setForm({
            category_id: String(product.category_id),
            product_name: product.product_name || '',
            brand: product.brand || '',
            unit_label: product.unit_label || '',
            description: product.description || '',
            mrp: product.mrp ?? '',
            price: product.price ?? '',
            initial_stock: product.initial_stock ?? '',
            available_quantity: product.available_quantity ?? '',
            product_image: product.product_image || ''
        });

        setShowForm(true);
        setError('');
        setMessage('');
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setError('');
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();

        if (!categoryForm.category_name.trim()) {
            setError('Please enter a category name.');
            return;
        }

        if (
            categoryForm.parent_category_id &&
            !mainCategories.some(
                (category) =>
                    String(category.category_id) === categoryForm.parent_category_id
            )
        ) {
            setError('Please select a valid main category.');
            return;
        }

        try {
            setCategorySaving(true);
            setError('');
            setMessage('');

            const response = await fetch(`${API}/categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    category_name: categoryForm.category_name.trim(),
                    parent_category_id: categoryForm.parent_category_id
                        ? Number(categoryForm.parent_category_id)
                        : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to create category.');
            }

            setMessage(data.message || 'Category created successfully!');
            setCategoryForm({
                category_name: '',
                parent_category_id: ''
            });

            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setCategorySaving(false);
        }
    };

    const handleDelete = async (productId) => {
        const confirmed = window.confirm(
            'Are you sure you want to remove this product?'
        );

        if (!confirmed) return;

        try {
            setError('');
            setMessage('');

            const response = await fetch(`${API}/${productId}`, {
                method: 'DELETE',
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to remove product.');
            }

            setMessage(data.message);
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.category_id) {
            setError('Please select a category.');
            return;
        }

        if (
            form.mrp !== '' &&
            Number(form.mrp) < Number(form.price)
        ) {
            setError('MRP must be greater than or equal to selling price.');
            return;
        }

        if (
            Number(form.available_quantity) > Number(form.initial_stock)
        ) {
            setError('Available stock cannot exceed initial stock.');
            return;
        }

        const productData = {
            ...form,
            category_id: Number(form.category_id),
            price: Number(form.price),
            mrp: form.mrp === '' ? null : Number(form.mrp),
            initial_stock: Number(form.initial_stock),
            available_quantity:
                form.available_quantity === ''
                    ? Number(form.initial_stock)
                    : Number(form.available_quantity)
        };

        try {
            setSaving(true);
            setError('');
            setMessage('');

            const response = await fetch(
                editingId ? `${API}/${editingId}` : API,
                {
                    method: editingId ? 'PUT' : 'POST',
                    headers,
                    body: JSON.stringify(productData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to save product.');
            }

            setMessage(data.message);
            closeForm();
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.product_name.toLowerCase().includes(search.toLowerCase()) ||
            (product.brand || '').toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            categoryFilter === 'all' ||
            String(product.category_id) === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    const formatPrice = (value) =>
        `₹${Number(value || 0).toFixed(2)}`;

    const getStockStatus = (quantity) => {
        if (Number(quantity) === 0) return 'Out of stock';
        if (Number(quantity) <= 5) return 'Low stock';
        return 'In stock';
    };

    return (
        <div className="products-page">
            <div className="products-header">
                <div>
                    <p className="products-eyebrow">INVENTORY MANAGEMENT</p>
                    <h2>Products</h2>
                    <p>Manage your store products, prices and stock.</p>
                </div>

                <div className="products-header-actions">
                    <button
                        className="product-secondary-button"
                        onClick={() => {
                            setShowCategoryManager(!showCategoryManager);
                            setError('');
                        }}
                    >
                        {showCategoryManager ? 'Close Categories' : 'Manage Categories'}
                    </button>

                    <button className="product-primary-button" onClick={openAddForm}>
                        + Add Product
                    </button>
                </div>
            </div>

            <div className="product-stat-grid">
                <div className="product-stat-card">
                    <span>Total Products</span>
                    <strong>{products.length}</strong>
                </div>

                <div className="product-stat-card">
                    <span>Categories</span>
                    <strong>{categories.length}</strong>
                </div>

                <div className="product-stat-card">
                    <span>Low Stock</span>
                    <strong>
                        {products.filter(
                            (item) =>
                                Number(item.available_quantity) > 0 &&
                                Number(item.available_quantity) <= 5
                        ).length}
                    </strong>
                </div>

                <div className="product-stat-card">
                    <span>Out of Stock</span>
                    <strong>
                        {products.filter(
                            (item) => Number(item.available_quantity) === 0
                        ).length}
                    </strong>
                </div>
            </div>

            {message && (
                <div className="product-success-message">{message}</div>
            )}

            {error && (
                <div className="product-error-message">{error}</div>
            )}

            {showCategoryManager && (
                <div className="product-form-card">
                    <div className="product-form-heading">
                        <div>
                            <h3>Manage Categories</h3>
                            <p>Create main categories and subcategories for your store.</p>
                        </div>
                    </div>

                    <form onSubmit={handleCategorySubmit}>
                        <div className="product-form-grid">
                            <div className="product-field">
                                <label>Category Name *</label>
                                <input
                                    type="text"
                                    value={categoryForm.category_name}
                                    onChange={(e) => {
                                        setCategoryForm((previous) => ({
                                            ...previous,
                                            category_name: e.target.value
                                        }));
                                        setError('');
                                    }}
                                    placeholder="e.g. Fruits & Vegetables"
                                    required
                                />
                            </div>

                            <div className="product-field">
                                <label>Category Type</label>
                                <select
                                    value={categoryForm.parent_category_id}
                                    onChange={(e) => {
                                        setCategoryForm((previous) => ({
                                            ...previous,
                                            parent_category_id: e.target.value
                                        }));
                                        setError('');
                                    }}
                                >
                                    <option value="">Main Category</option>

                                    {mainCategories.map((category) => (
                                        <option
                                            key={category.category_id}
                                            value={category.category_id}
                                        >
                                            Subcategory of {category.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="category-form-note">
                            Leave Category Type as Main Category to create a new main
                            category. Choose an existing category to create a subcategory.
                        </div>

                        <div className="product-form-actions">
                            <button
                                type="submit"
                                className="product-primary-button"
                                disabled={categorySaving}
                            >
                                {categorySaving ? 'Saving...' : '+ Add Category'}
                            </button>
                        </div>
                    </form>

                    <div className="category-list">
                        <h4>Existing Categories</h4>

                        {categories.length === 0 ? (
                            <p>No categories created yet.</p>
                        ) : (
                            <ul>
                                {categories.map((category) => (
                                    <li key={category.category_id}>
                                        {category.parent_category_id ? (
                                            <span className="category-sub-item">
                                                ↳ {category.category_name}
                                            </span>
                                        ) : (
                                            <strong>{category.category_name}</strong>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {showForm && (
                <div className="product-form-card">
                    <div className="product-form-heading">
                        <div>
                            <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                            <p>Enter the product information below.</p>
                        </div>

                        <button
                            type="button"
                            className="product-close-button"
                            onClick={closeForm}
                        >
                            ×
                        </button>
                    </div>

                    {categories.length === 0 ? (
                        <p className="product-error-message">
                            Create a category before adding products.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="product-form-grid">
                                <div className="product-field">
                                    <label>Product Name *</label>
                                    <input
                                        name="product_name"
                                        value={form.product_name}
                                        onChange={updateForm}
                                        placeholder="e.g. Aashirvaad Atta"
                                        required
                                    />
                                </div>

                                <div className="product-field">
                                    <label>Brand</label>
                                    <input
                                        name="brand"
                                        value={form.brand}
                                        onChange={updateForm}
                                        placeholder="e.g. Aashirvaad"
                                    />
                                </div>

                                <div className="product-field">
                                    <label>Category *</label>
                                    <select
                                        name="category_id"
                                        value={form.category_id}
                                        onChange={updateForm}
                                        required
                                    >
                                        <option value="">Select category</option>

                                        {categories.map((category) => (
                                            <option
                                                key={category.category_id}
                                                value={category.category_id}
                                            >
                                                {category.parent_category_id
                                                    ? `↳ ${category.category_name}`
                                                    : category.category_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="product-field">
                                    <label>Unit / Quantity</label>
                                    <input
                                        name="unit_label"
                                        value={form.unit_label}
                                        onChange={updateForm}
                                        placeholder="e.g. 1 kg, 500 g, 1 litre"
                                    />
                                </div>

                                <div className="product-field">
                                    <label>MRP (₹)</label>
                                    <input
                                        type="number"
                                        name="mrp"
                                        min="0"
                                        step="0.01"
                                        value={form.mrp}
                                        onChange={updateForm}
                                        placeholder="Enter MRP"
                                    />
                                </div>

                                <div className="product-field">
                                    <label>Selling Price (₹) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        min="0"
                                        step="0.01"
                                        value={form.price}
                                        onChange={updateForm}
                                        placeholder="Enter selling price"
                                        required
                                    />
                                </div>

                                <div className="product-field">
                                    <label>Initial Stock *</label>
                                    <input
                                        type="number"
                                        name="initial_stock"
                                        min="0"
                                        step="1"
                                        value={form.initial_stock}
                                        onChange={updateForm}
                                        placeholder="Enter stock quantity"
                                        required
                                    />
                                </div>

                                {editingId && (
                                    <div className="product-field">
                                        <label>Available Stock *</label>
                                        <input
                                            type="number"
                                            name="available_quantity"
                                            min="0"
                                            step="1"
                                            value={form.available_quantity}
                                            onChange={updateForm}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="product-field full-width">
                                    <label>Product Image URL</label>
                                    <input
                                        type="url"
                                        name="product_image"
                                        value={form.product_image}
                                        onChange={updateForm}
                                        placeholder="Paste an image URL (optional)"
                                    />
                                </div>

                                <div className="product-field full-width">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={updateForm}
                                        placeholder="Enter product description"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="product-error-message">{error}</div>
                            )}

                            <div className="product-form-actions">
                                <button
                                    type="button"
                                    className="product-secondary-button"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="product-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingId
                                            ? 'Update Product'
                                            : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <div className="product-list-card">
                <div className="product-list-heading">
                    <div>
                        <h3>Product Inventory</h3>
                        <p>{filteredProducts.length} products found</p>
                    </div>
                </div>

                <div className="product-filters">
                    <input
                        type="search"
                        placeholder="Search by product or brand..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>

                        {categories.map((category) => (
                            <option
                                key={category.category_id}
                                value={category.category_id}
                            >
                                {category.category_name}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <p className="product-empty-state">Loading products...</p>
                ) : filteredProducts.length === 0 ? (
                    <div className="product-empty-state">
                        <div className="product-empty-icon">□</div>
                        <h3>No products found</h3>
                        <p>Add your first product to start managing inventory.</p>
                        <button
                            className="product-primary-button"
                            onClick={openAddForm}
                        >
                            + Add Product
                        </button>
                    </div>
                ) : (
                    <div className="product-table-wrapper">
                        <table className="product-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>MRP</th>
                                    <th>Selling Price</th>
                                    <th>Available Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.product_id}>
                                        <td>
                                            <div className="product-name-cell">
                                                {product.product_image ? (
                                                    <img
                                                        src={product.product_image}
                                                        alt={product.product_name}
                                                    />
                                                ) : (
                                                    <div className="product-image-placeholder">
                                                        {product.product_name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                <div>
                                                    <strong>{product.product_name}</strong>
                                                    <small>
                                                        {product.brand || 'No brand'} · {product.unit_label || 'Unit not specified'}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{product.category_name}</td>
                                        <td>{formatPrice(product.mrp)}</td>
                                        <td>
                                            <strong>{formatPrice(product.price)}</strong>
                                        </td>
                                        <td>{product.available_quantity}</td>

                                        <td>
                                            <span className={`product-stock-status ${Number(product.available_quantity) === 0
                                                    ? 'out'
                                                    : Number(product.available_quantity) <= 5
                                                        ? 'low'
                                                        : 'available'
                                                }`}>
                                                {getStockStatus(product.available_quantity)}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="product-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(product)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(product.product_id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Products;
