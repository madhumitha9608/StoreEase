
import { useEffect, useState } from 'react';
import './Orders.css';

const API = 'http://localhost:5000/api/orders';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const token = localStorage.getItem('storeeaseToken');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(API, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to load orders.');
            }

            // Group the rows so each order appears only once.
            const groupedOrders = Object.values(
                (data.orders || []).reduce((result, item) => {
                    if (!result[item.order_id]) {
                        result[item.order_id] = {
                            order_id: item.order_id,
                            customer_user_id: item.customer_user_id,
                            total_amount: item.total_amount,
                            payment_method: item.payment_method,
                            payment_status: item.payment_status,
                            order_status: item.order_status,
                            created_at: item.created_at,
                            items: []
                        };
                    }

                    if (item.order_item_id) {
                        result[item.order_id].items.push({
                            order_item_id: item.order_item_id,
                            product_name: item.product_name,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            subtotal: item.subtotal
                        });
                    }

                    return result;
                }, {})
            );

            setOrders(groupedOrders);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (orderId, status) => {
        try {
            setUpdatingId(orderId);
            setError('');

            const response = await fetch(
                `${API}/${orderId}/status`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        order_status: status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to update order.');
            }

            await fetchOrders();

        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const getStatusClass = (status) => {
        return status.replaceAll('_', '-');
    };

    const totalOrders = orders.length;
    const placedOrders = orders.filter(
        order => order.order_status === 'placed'
    ).length;
    const preparingOrders = orders.filter(
        order => order.order_status === 'preparing'
    ).length;
    const deliveredOrders = orders.filter(
        order => order.order_status === 'delivered'
    ).length;

    const statuses = [
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled'
    ];

    return (
        <div className="orders-page">

            <div className="orders-header">
                <div>
                    <h1>Orders</h1>
                    <p>Manage and track your store orders.</p>
                </div>

                <button
                    className="orders-refresh-btn"
                    onClick={fetchOrders}
                    disabled={loading}
                >
                    Refresh Orders
                </button>
            </div>

            <div className="orders-summary">

                <div className="order-summary-card">
                    <span>Total Orders</span>
                    <h2>{totalOrders}</h2>
                </div>

                <div className="order-summary-card">
                    <span>Placed</span>
                    <h2>{placedOrders}</h2>
                </div>

                <div className="order-summary-card">
                    <span>Preparing</span>
                    <h2>{preparingOrders}</h2>
                </div>

                <div className="order-summary-card">
                    <span>Delivered</span>
                    <h2>{deliveredOrders}</h2>
                </div>

            </div>

            {error && (
                <div className="orders-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="orders-message">
                    Loading orders...
                </div>
            ) : orders.length === 0 ? (
                <div className="orders-empty">
                    <h2>No Orders Yet</h2>
                    <p>
                        Customer orders will appear here when someone
                        places an order from your store.
                    </p>
                </div>
            ) : (
                <div className="orders-list">

                    {orders.map(order => (
                        <div className="order-card" key={order.order_id}>

                            <div className="order-card-header">
                                <div>
                                    <h3>Order #{order.order_id}</h3>
                                    <p>Customer ID: {order.customer_user_id}</p>
                                </div>

                                <span className={`order-status ${getStatusClass(order.order_status)}`}>
                                    {order.order_status.replaceAll('_', ' ')}
                                </span>
                            </div>

                            <div className="order-info-grid">
                                <div>
                                    <span>Order Date</span>
                                    <strong>{formatDate(order.created_at)}</strong>
                                </div>

                                <div>
                                    <span>Total Amount</span>
                                    <strong>₹{Number(order.total_amount).toFixed(2)}</strong>
                                </div>

                                <div>
                                    <span>Payment Method</span>
                                    <strong>{order.payment_method.replaceAll('_', ' ')}</strong>
                                </div>

                                <div>
                                    <span>Payment Status</span>
                                    <strong>{order.payment_status}</strong>
                                </div>
                            </div>

                            <div className="order-products">
                                <h4>Ordered Products</h4>

                                {order.items.length === 0 ? (
                                    <p>No product details available.</p>
                                ) : (
                                    order.items.map(item => (
                                        <div
                                            className="order-product-row"
                                            key={item.order_item_id}
                                        >
                                            <span>{item.product_name}</span>
                                            <span>Qty: {item.quantity}</span>
                                            <span>
                                                ₹{Number(item.subtotal).toFixed(2)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {order.order_status !== 'delivered' &&
                                order.order_status !== 'cancelled' && (
                                    <div className="order-status-update">
                                        <label>Update Order Status</label>

                                        <select
                                            value={order.order_status}
                                            onChange={(e) =>
                                                updateStatus(
                                                    order.order_id,
                                                    e.target.value
                                                )
                                            }
                                            disabled={updatingId === order.order_id}
                                        >
                                            <option value={order.order_status}>
                                                {order.order_status.replaceAll('_', ' ')}
                                            </option>

                                            {statuses
                                                .filter(status =>
                                                    status !== order.order_status
                                                )
                                                .map(status => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status.replaceAll('_', ' ')}
                                                    </option>
                                                ))}
                                        </select>

                                        {updatingId === order.order_id && (
                                            <span>Updating...</span>
                                        )}
                                    </div>
                                )}

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default Orders;
