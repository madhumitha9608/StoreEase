
import { useState } from 'react'
import './App.css'

const orders = [
  {
    id: 'SE1001',
    store: 'Fresh Mart',
    location: 'Coimbatore',
    customer: 'Arun Kumar',
    address: 'RS Puram, Coimbatore',
    amount: '₹850'
  },
  {
    id: 'SE1002',
    store: 'Fashion Hub',
    location: 'Tiruppur',
    customer: 'Priya',
    address: 'Avinashi Road, Tiruppur',
    amount: '₹1,250'
  },
  {
    id: 'SE1003',
    store: 'Tech World',
    location: 'Erode',
    customer: 'Karthik',
    address: 'Perundurai Road, Erode',
    amount: '₹2,400'
  }
]

function App() {
  const [isRegister, setIsRegister] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [acceptedOrders, setAcceptedOrders] = useState([])
  const [deliveryStatuses, setDeliveryStatuses] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoggedIn(true)
  }

  const acceptOrder = (id) => {
    setAcceptedOrders([...acceptedOrders, id])

    setDeliveryStatuses({
      ...deliveryStatuses,
      [id]: 'Accepted'
    })
  }

  const updateDeliveryStatus = (id) => {
    const stages = [
      'Accepted',
      'Picked Up',
      'Out for Delivery',
      'Delivered'
    ]

    const currentStatus = deliveryStatuses[id]
    const currentIndex = stages.indexOf(currentStatus)

    if (currentIndex < stages.length - 1) {
      setDeliveryStatuses({
        ...deliveryStatuses,
        [id]: stages[currentIndex + 1]
      })
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>StoreEase</h1>
          <p className="auth-subtitle">Delivery Partner Portal</p>

          <h2>{isRegister ? 'Create Account' : 'Welcome Back!'}</h2>
          <p className="auth-description">
            {isRegister
              ? 'Register as a delivery partner'
              : 'Login to your delivery account'}
          </p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <label>Full Name</label>
                <input type="text" placeholder="Enter your full name" required />

                <label>Phone Number</label>
                <input type="tel" placeholder="Enter your phone number" required />

                <label>Vehicle Type</label>
                <select required defaultValue="">
                  <option value="" disabled>Select vehicle type</option>
                  <option>Bike</option>
                  <option>Scooter</option>
                  <option>Other</option>
                </select>
              </>
            )}

            <label>Email Address</label>
            <input type="email" placeholder="Enter your email" required />

            <label>Password</label>
            <input type="password" placeholder="Enter your password" required />

            {isRegister && (
              <>
                <label>Confirm Password</label>
                <input type="password" placeholder="Confirm your password" required />
              </>
            )}

            <button type="submit" className="auth-btn">
              {isRegister ? 'Register' : 'Login'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>StoreEase</h2>
        <p className="role">Delivery Partner</p>

        <nav>
          {['Dashboard', 'Available Orders', 'My Deliveries', 'Earnings', 'My Profile'].map(page => (
            <button
              key={page}
              className={activePage === page ? 'nav-link active' : 'nav-link'}
              onClick={() => setActivePage(page)}
            >
              {page}
            </button>
          ))}
        </nav>

        <button
          className="logout-btn"
          onClick={() => {
            setIsLoggedIn(false)
            setActivePage('Dashboard')
          }}
        >
          Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>
            <p>Welcome to StoreEase Delivery!</p>
          </div>
          <div className="profile">🚴 Delivery Partner</div>
        </header>

        {activePage === 'Dashboard' && (
          <>
            <section className="summary">
              <div className="summary-card">
                <h3>Available Orders</h3>
                <h2>{orders.length - acceptedOrders.length}</h2>
              </div>
              <div className="summary-card">
                <h3>Active Deliveries</h3>
                <h2>{acceptedOrders.length}</h2>
              </div>
              <div className="summary-card">
                <h3>Completed Deliveries</h3>
                <h2>24</h2>
              </div>
              <div className="summary-card">
                <h3>Total Earnings</h3>
                <h2>₹2,400</h2>
              </div>
            </section>

            <section className="content-section">
              <h2>Recent Activity</h2>
              <p>Your delivery activities will appear here.</p>
            </section>
          </>
        )}

        {activePage === 'Available Orders' && (
          <section className="orders-section">
            <h2>Available Orders</h2>
            <p className="section-description">
              View orders waiting for a delivery partner.
            </p>

            {orders.filter(order => !acceptedOrders.includes(order.id)).map(order => (
              <div className="order-card" key={order.id}>
                <div>
                  <h3>Order #{order.id}</h3>
                  <p><strong>Store:</strong> {order.store}</p>
                  <p><strong>District:</strong> {order.location}</p>
                  <p><strong>Customer:</strong> {order.customer}</p>
                  <p><strong>Delivery Address:</strong> {order.address}</p>
                  <p><strong>Order Amount:</strong> {order.amount}</p>
                </div>

                <button
                  className="accept-btn"
                  onClick={() => acceptOrder(order.id)}
                >
                  Accept Order
                </button>
              </div>
            ))}

            {orders.every(order => acceptedOrders.includes(order.id)) && (
              <p className="empty-message">No available orders at the moment.</p>
            )}
          </section>
        )}


        {activePage === 'My Deliveries' && (
          <section className="content-section">
            <h2>My Deliveries</h2>

            {orders
              .filter(order => acceptedOrders.includes(order.id))
              .map(order => {
                const status = deliveryStatuses[order.id] || 'Accepted'

                return (
                  <div className="delivery-card" key={order.id}>
                    <h3>Order #{order.id}</h3>

                    <p><strong>Customer:</strong> {order.customer}</p>
                    <p><strong>Store:</strong> {order.store}</p>
                    <p><strong>Address:</strong> {order.address}</p>

                    <div className="delivery-status">
                      <strong>Current Status:</strong>
                      <span className="status-label">{status}</span>
                    </div>

                    <button
                      className="status-btn"
                      onClick={() => updateDeliveryStatus(order.id)}
                      disabled={status === 'Delivered'}
                    >
                      {status === 'Accepted' && 'Mark as Picked Up'}
                      {status === 'Picked Up' && 'Mark as Out for Delivery'}
                      {status === 'Out for Delivery' && 'Mark as Delivered'}
                      {status === 'Delivered' && 'Delivery Completed'}
                    </button>
                  </div>
                )
              })}

            {acceptedOrders.length === 0 && (
              <p>You have not accepted any orders yet.</p>
            )}
          </section>
        )}


        {activePage === 'Earnings' && (
          <section className="content-section">
            <h2>Earnings Summary</h2>
            <h2>₹2,400</h2>
            <p>Sample total earnings from completed deliveries.</p>
          </section>
        )}

        {activePage === 'My Profile' && (
          <section className="content-section">
            <h2>Delivery Partner Profile</h2>
            <p>Name: Delivery Partner</p>
            <p>Vehicle: Not specified</p>
            <p>Account: Demo profile</p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
