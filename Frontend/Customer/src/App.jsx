
import { useState } from 'react';
import './App.css';

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+.,?-]/.test(password);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isRegister) {
      if (!hasMinLength || !hasNumber || !hasSpecialChar) {
        setPasswordError(
          'Invalid password! Please meet all three requirements.'
        );
        setPasswordSuccess(false);
        return;
      }

      setPasswordError('');
      setPasswordSuccess(true);
      return;
    }

    alert('Login form submitted. Authentication is not connected yet.');
  };

  const resetPassword = () => {
    setPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
  };

  return (
    <div className="customer-app">

      <nav className="navbar">
        <h1 className="logo">StoreEase</h1>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#stores">Explore Stores</a>
          <a href="#orders">My Orders</a>
        </div>

        <button
          className="login-btn"
          onClick={() => {
            setShowAuth(true);
            setIsRegister(false);
            resetPassword();
          }}
        >
          Login / Register
        </button>
      </nav>

      {showAuth ? (
        <section className="auth-section">
          <div className="auth-card">
            <button
              className="auth-close"
              onClick={() => setShowAuth(false)}
            >
              ×
            </button>

            <h2>{isRegister ? 'Create Account' : 'Welcome Back!'}</h2>

            <p>
              {isRegister
                ? 'Register to start shopping with StoreEase.'
                : 'Login to continue shopping with StoreEase.'}
            </p>

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email Address"
                required
              />

              {isRegister && (
                <input
                  type="tel"
                  placeholder="Phone Number"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
              )}

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                  setPasswordSuccess(false);
                }}
                required
              />

              {isRegister && (
                <div style={{ marginTop: '8px', fontSize: '12px' }}>
                  <p style={{ color: '#89777D', marginBottom: '6px' }}>
                    Password requirements:
                  </p>

                  <p style={{ color: hasMinLength ? 'green' : '#c0392b' }}>
                    {hasMinLength ? '✓' : '✗'} At least 8 characters
                  </p>

                  <p style={{ color: hasNumber ? 'green' : '#c0392b' }}>
                    {hasNumber ? '✓' : '✗'} At least one number
                  </p>

                  <p style={{ color: hasSpecialChar ? 'green' : '#c0392b' }}>
                    {hasSpecialChar ? '✓' : '✗'} At least one special character
                  </p>
                </div>
              )}

              {passwordError && (
                <p style={{
                  color: '#c0392b',
                  fontSize: '13px',
                  marginTop: '10px'
                }}>
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p style={{
                  color: 'green',
                  fontSize: '13px',
                  marginTop: '10px'
                }}>
                  ✓ Password meets all requirements!
                </p>
              )}

              <button type="submit" className="auth-submit">
                {isRegister ? 'Register' : 'Login'}
              </button>
            </form>

            <div className="auth-switch">
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account?"}

              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  resetPassword();
                }}
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </div>

            <button
              className="back-home"
              onClick={() => setShowAuth(false)}
            >
              Back to Home
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="hero" id="home">
            <div className="hero-content">
              <span className="tagline">YOUR LOCAL SHOPPING DESTINATION</span>

              <h2>
                Discover Local Stores.<br />
                Shop <span>Smarter.</span>
              </h2>

              <p>
                Find stores near you, explore products and enjoy
                a convenient local shopping experience across Tamil Nadu.
              </p>

              <button
                className="explore-btn"
                onClick={() =>
                  document.getElementById('stores').scrollIntoView({
                    behavior: 'smooth'
                  })
                }
              >
                Explore Stores
              </button>
            </div>

            <div className="hero-visual">
              <div className="visual-circle">
                <span>🛍️</span>
              </div>
              <div className="visual-label">
                <strong>Shop Local</strong>
                <p>Support local businesses</p>
              </div>
            </div>
          </section>

          <section className="district-section" id="stores">
            <div>
              <span className="tagline">FIND YOUR LOCAL STORES</span>
              <h2>Where would you like to shop?</h2>
              <p>Select your district to discover registered stores.</p>
            </div>

            <div className="district-search">
              <select defaultValue="">
                <option value="" disabled>Select District</option>
                <option>Ariyalur</option>
                <option>Chengalpattu</option>
                <option>Chennai</option>
                <option>Coimbatore</option>
                <option>Cuddalore</option>
                <option>Dharmapuri</option>
                <option>Dindigul</option>
                <option>Erode</option>
                <option>Kallakurichi</option>
                <option>Kancheepuram</option>
                <option>Kanniyakumari</option>
                <option>Karur</option>
                <option>Krishnagiri</option>
                <option>Madurai</option>
                <option>Mayiladuthurai</option>
                <option>Nagapattinam</option>
                <option>Namakkal</option>
                <option>Nilgiris</option>
                <option>Perambalur</option>
                <option>Pudukkottai</option>
                <option>Ramanathapuram</option>
                <option>Ranipet</option>
                <option>Salem</option>
                <option>Sivaganga</option>
                <option>Tenkasi</option>
                <option>Thanjavur</option>
                <option>Theni</option>
                <option>Thoothukudi</option>
                <option>Tiruchirappalli</option>
                <option>Tirunelveli</option>
                <option>Tirupathur</option>
                <option>Tiruppur</option>
                <option>Tiruvallur</option>
                <option>Tiruvannamalai</option>
                <option>Tiruvarur</option>
                <option>Vellore</option>
                <option>Viluppuram</option>
                <option>Virudhunagar</option>
              </select>

              <button>Find Stores</button>
            </div>
          </section>

          <section className="categories">
            <span className="tagline">EXPLORE CATEGORIES</span>
            <h2>What are you looking for?</h2>

            <div className="category-grid">
              <div className="category-card">
                <span>🥬</span>
                <h3>Groceries</h3>
              </div>
              <div className="category-card">
                <span>👕</span>
                <h3>Clothing</h3>
              </div>
              <div className="category-card">
                <span>💻</span>
                <h3>Electronics</h3>
              </div>
              <div className="category-card">
                <span>🏠</span>
                <h3>Home Essentials</h3>
              </div>
            </div>
          </section>

          <footer>
            <h2>StoreEase</h2>
            <p>Your neighbourhood, your stores, your convenience.</p>
            <p>© 2026 StoreEase. All rights reserved.</p>
          </footer>
        </>
      )}

    </div>
  );
}

export default App;
