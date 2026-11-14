
import Products from './Products';
import Orders from './Orders';
import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

const districts = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore',
  'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode',
  'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam',
  'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi',
  'Tiruchirappalli', 'Tirunelveli', 'Tirupathur',
  'Tiruppur', 'Tiruvallur', 'Tiruvannamalai',
  'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
];

const storeIcon = L.divIcon({
  className: 'store-map-marker',
  html: '<div class="custom-pin">📍</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

function MapClickHandler({ setSelectedLocation, enabled }) {
  useMapEvents({
    click(event) {
      if (!enabled) return;

      setSelectedLocation({
        lat: event.latlng.lat,
        lng: event.latlng.lng
      });
    }
  });

  return null;
}

function MapController({ searchPosition }) {
  const map = useMap();

  useEffect(() => {
    if (searchPosition) {
      map.flyTo(
        [searchPosition.lat, searchPosition.lng],
        16,
        { duration: 1.5 }
      );
    }
  }, [searchPosition, map]);

  return null;
}

function App() {
  // Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [account, setAccount] = useState(null);

  const [authForm, setAuthForm] = useState({
    ownerName: '',
    phone: '',
    email: '',
    password: ''
  });

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Store information
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [district, setDistrict] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeName, setStoreName] = useState('');
  const [savingStore, setSavingStore] = useState(false);
  const [storeSaveMessage, setStoreSaveMessage] = useState('');
  const [storeSaveError, setStoreSaveError] = useState('');
  const [storeAlreadyRegistered, setStoreAlreadyRegistered] = useState(false);
  const [loadingStoreDetails, setLoadingStoreDetails] = useState(false);

  // One state controls the entire store editing interface.
  const [isEditingStore, setIsEditingStore] = useState(false);

  // Address search
  const [searchPosition, setSearchPosition] = useState(null);
  const [searching, setSearching] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  // Password validation
  const hasMinLength = authForm.password.length >= 8;
  const hasNumber = /[0-9]/.test(authForm.password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(authForm.password);

  const passwordValid =
    hasMinLength && hasNumber && hasSpecialChar;

  const updateAuthForm = (e) => {
    const { name, value } = e.target;

    setAuthForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setAuthError('');
    setAuthSuccess('');
  };

  const switchAuthMode = (registerMode) => {
    setIsRegister(registerMode);
    setAuthError('');
    setAuthSuccess('');

    setAuthForm({
      ownerName: '',
      phone: '',
      email: '',
      password: ''
    });
  };

  // Register account
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!passwordValid) {
      setAuthError(
        'Password must contain at least 8 characters, one number and one special character.'
      );
      return;
    }

    if (
      !authForm.ownerName.trim() ||
      !authForm.email.trim() ||
      !authForm.phone.trim()
    ) {
      setAuthError('Please complete all required fields.');
      return;
    }

    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: authForm.ownerName.trim(),
          email: authForm.email.trim().toLowerCase(),
          phone: authForm.phone.trim(),
          password: authForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      setIsRegister(false);
      setAuthForm((previous) => ({
        ...previous,
        password: ''
      }));
      setAuthSuccess('Account created successfully! Please log in.');
      setAuthError('');
    } catch (error) {
      setAuthError(
        error.message === 'Failed to fetch'
          ? 'Unable to connect to StoreEase server. Please make sure the backend is running.'
          : error.message
      );
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();

    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: authForm.email.trim().toLowerCase(),
          password: authForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      localStorage.setItem('storeeaseToken', data.token);
      setAccount(data.user);
      setIsLoggedIn(true);
      setAuthError('');
    } catch (error) {
      setAuthError(
        error.message === 'Failed to fetch'
          ? 'Unable to connect to StoreEase server. Please make sure the backend is running.'
          : error.message
      );
    }
  };

  // Load saved store details
  const loadMyStore = async () => {
    const token = localStorage.getItem('storeeaseToken');

    if (!token) {
      throw new Error('Your login session was not found. Please log in again.');
    }

    const response = await fetch('http://localhost:5000/api/stores/my-store', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.status === 404) {
      setStoreAlreadyRegistered(false);
      setIsEditingStore(false);
      return false;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load store details.');
    }

    const store = data.store;

    setStoreName(store.store_name || '');
    setStoreAddress(store.store_address || '');
    setDistrict(store.district || '');

    if (store.latitude !== null && store.longitude !== null) {
      const savedLocation = {
        lat: Number(store.latitude),
        lng: Number(store.longitude)
      };

      setSelectedLocation(savedLocation);
      setSearchPosition(savedLocation);
    }

    setStoreAlreadyRegistered(true);
    return true;
  };

  // Load store details after login
  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    const loadStore = async () => {
      setLoadingStoreDetails(true);

      try {
        const loaded = await loadMyStore();

        if (cancelled) return;

        if (loaded) {
          setStoreSaveMessage('Your saved store details have been loaded.');
        } else {
          setStoreSaveMessage('');
        }

        setStoreSaveError('');
      } catch (error) {
        if (!cancelled) {
          setStoreSaveError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingStoreDetails(false);
        }
      }
    };

    loadStore();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('storeeaseToken');

    setIsLoggedIn(false);
    setAccount(null);
    setIsRegister(false);
    setStoreAlreadyRegistered(false);
    setIsEditingStore(false);

    setStoreName('');
    setStoreAddress('');
    setDistrict('');
    setSelectedLocation(null);
    setSearchPosition(null);

    setStoreSaveMessage('');
    setStoreSaveError('');
    setAuthError('');
    setAuthSuccess('');
    setLocationMessage('');

    setAuthForm({
      ownerName: '',
      phone: '',
      email: '',
      password: ''
    });
  };

  // Enter store editing mode
  const handleEditStore = () => {
    setIsEditingStore(true);
    setStoreSaveMessage('');
    setStoreSaveError('');
    setLocationMessage('');
  };

  // Cancel editing and restore saved details
  const handleCancelEditing = async () => {
    setLoadingStoreDetails(true);
    setStoreSaveError('');
    setStoreSaveMessage('');

    try {
      await loadMyStore();

      setIsEditingStore(false);
      setStoreSaveMessage(
        'Editing cancelled. Your saved details have not been changed.'
      );
      setLocationMessage('');
    } catch (error) {
      setStoreSaveError(error.message);
    } finally {
      setLoadingStoreDetails(false);
    }
  };

  // Search store address using OpenStreetMap
  const handleLocationSearch = async () => {
    if (!storeAddress.trim()) {
      setLocationMessage('Please enter your store address.');
      return;
    }

    if (!district) {
      setLocationMessage('Please select your district first.');
      return;
    }

    setSearching(true);
    setLocationMessage('');

    try {
      const query = `${storeAddress}, ${district}, Tamil Nadu, India`;

      const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Location search failed.');
      }

      const results = await response.json();

      if (results.length === 0) {
        setLocationMessage(
          'Location not found. Try entering a nearby landmark or a more complete address.'
        );
        return;
      }

      const result = results[0];

      const newLocation = {
        lat: Number(result.lat),
        lng: Number(result.lon)
      };

      setSelectedLocation(newLocation);
      setSearchPosition(newLocation);

      setLocationMessage('Location found! The map marker has been placed.');
    } catch (error) {
      setLocationMessage(
        'Unable to search right now. Please check your internet connection and try again.'
      );
    } finally {
      setSearching(false);
    }
  };

  // Save or update store details
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (storeAlreadyRegistered && !isEditingStore) {
      return;
    }

    if (!storeName.trim()) {
      setStoreSaveError('Please enter your store name.');
      setStoreSaveMessage('');
      return;
    }

    if (!storeAddress.trim() || !district) {
      setStoreSaveError('Please enter your store address and select your district.');
      setStoreSaveMessage('');
      return;
    }

    if (!selectedLocation) {
      setStoreSaveError('Please search for your store address and select its location on the map.');
      setStoreSaveMessage('');
      return;
    }

    const token = localStorage.getItem('storeeaseToken');

    if (!token) {
      setStoreSaveError('Your login session was not found. Please log in again.');
      setStoreSaveMessage('');
      return;
    }

    setSavingStore(true);
    setStoreSaveError('');
    setStoreSaveMessage('');

    try {
      const response = await fetch(
        storeAlreadyRegistered
          ? 'http://localhost:5000/api/stores/my-store'
          : 'http://localhost:5000/api/stores',
        {
          method: storeAlreadyRegistered ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            store_name: storeName.trim(),
            store_address: storeAddress.trim(),
            district,
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lng,
            store_phone: account?.phone || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save store details.');
      }

      setStoreSaveMessage(
        storeAlreadyRegistered
          ? 'Store details updated successfully!'
          : 'Store details saved successfully!'
      );

      setStoreSaveError('');
      setStoreAlreadyRegistered(true);
      setIsEditingStore(false);
    } catch (error) {
      setStoreSaveError(
        error.message === 'Failed to fetch'
          ? 'Unable to connect to StoreEase server. Please make sure the backend is running.'
          : error.message
      );
      setStoreSaveMessage('');
    } finally {
      setSavingStore(false);
    }
  };

  // Authentication screen
  if (!isLoggedIn) {
    return (
      <div style={authStyles.page}>
        <div style={authStyles.card}>
          <div style={authStyles.logo}>
            <div style={authStyles.logoIcon}>S</div>
            <h1 style={authStyles.brand}>StoreEase</h1>
          </div>

          <p style={authStyles.subtitle}>STORE OWNER PORTAL</p>

          <h2 style={authStyles.heading}>
            {isRegister ? 'Create Your Account' : 'Welcome Back!'}
          </h2>

          <p style={authStyles.description}>
            {isRegister
              ? 'Register to manage your store with StoreEase.'
              : 'Sign in to access your Store Owner dashboard.'}
          </p>

          <form
            onSubmit={isRegister ? handleRegister : handleLogin}
            style={authStyles.form}
          >
            {isRegister && (
              <>
                <div style={authStyles.field}>
                  <label style={authStyles.label}>Owner Name</label>
                  <input
                    style={authStyles.input}
                    type="text"
                    name="ownerName"
                    placeholder="Enter your full name"
                    value={authForm.ownerName}
                    onChange={updateAuthForm}
                    required
                  />
                </div>

                <div style={authStyles.field}>
                  <label style={authStyles.label}>Phone Number</label>
                  <input
                    style={authStyles.input}
                    type="tel"
                    name="phone"
                    placeholder="Enter 10-digit phone number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    value={authForm.phone}
                    onChange={updateAuthForm}
                    required
                  />
                </div>
              </>
            )}

            <div style={authStyles.field}>
              <label style={authStyles.label}>Email Address</label>
              <input
                style={authStyles.input}
                type="email"
                name="email"
                placeholder="Enter your email"
                value={authForm.email}
                onChange={updateAuthForm}
                required
              />
            </div>

            <div style={authStyles.field}>
              <label style={authStyles.label}>Password</label>
              <input
                style={authStyles.input}
                type="password"
                name="password"
                placeholder="Enter your password"
                value={authForm.password}
                onChange={updateAuthForm}
                required
              />
            </div>

            {isRegister && (
              <div style={authStyles.passwordRules}>
                <p style={authStyles.rulesHeading}>
                  Password requirements:
                </p>

                <p style={{
                  ...authStyles.rule,
                  color: hasMinLength ? '#21834B' : '#B33B4A'
                }}>
                  {hasMinLength ? '✓' : '○'} At least 8 characters
                </p>

                <p style={{
                  ...authStyles.rule,
                  color: hasNumber ? '#21834B' : '#B33B4A'
                }}>
                  {hasNumber ? '✓' : '○'} At least one number
                </p>

                <p style={{
                  ...authStyles.rule,
                  color: hasSpecialChar ? '#21834B' : '#B33B4A'
                }}>
                  {hasSpecialChar ? '✓' : '○'} At least one special character
                </p>
              </div>
            )}

            {authError && (
              <p style={authStyles.error}>{authError}</p>
            )}

            {authSuccess && (
              <p style={authStyles.success}>{authSuccess}</p>
            )}

            <button type="submit" style={authStyles.button}>
              {isRegister ? 'Create Account' : 'Login'}
            </button>
          </form>

          <p style={authStyles.switchText}>
            {isRegister
              ? 'Already have an account?'
              : "Don't have an account?"}

            <button
              type="button"
              style={authStyles.switchButton}
              onClick={() => switchAuthMode(!isRegister)}
            >
              {isRegister ? 'Login' : 'Create Account'}
            </button>
          </p>

          <p style={authStyles.footer}>
            © 2026 StoreEase. Store Owner Portal.
          </p>
        </div>
      </div>
    );
  }

  // Store Owner dashboard
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">S</div>
          <h2>StoreEase</h2>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav>
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#store-details">Store Details</a>
          <a href="#location">Store Location</a>
          <a href="#products">Products</a>
          <a href="#orders">Orders</a>
        </nav>

        <div className="sidebar-footer">
          <p>Store Owner Portal</p>
          <span>Manage your business</span>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="welcome-label">STORE OWNER PORTAL</p>
            <h1>Dashboard</h1>
          </div>

          <div className="profile">
            <div className="profile-icon">
              {account?.full_name?.charAt(0).toUpperCase() || 'O'}
            </div>

            <span>{account?.full_name || 'Store Owner'}</span>

            <button
              type="button"
              onClick={handleLogout}
              style={authStyles.logoutButton}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="welcome-card">
          <div>
            <p>WELCOME TO STOREEASE</p>
            <h2>Manage your store with ease.</h2>
            <span>
              Set up your store profile to start reaching customers.
            </span>
          </div>

          <div className="welcome-symbol">S</div>
        </section>

        <section className="section" id="store-details">
          <div className="section-heading">
            <h2>Store Setup</h2>
            <p>Complete your store information to get started.</p>
          </div>

          <div className="setup-card">
            <div className="setup-title">
              <span className="step-number">01</span>
              <div>
                <h3>Store Information</h3>
                <p>
                  {storeAlreadyRegistered && !isEditingStore
                    ? 'Your saved business details.'
                    : 'Enter your basic business details.'}
                </p>
              </div>
            </div>

            <form
              key={isEditingStore ? 'editing-store' : 'viewing-store'}
              onSubmit={handleSubmit}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Store Name</label>
                  <input
                    type="text"
                    placeholder="Enter your store name"
                    value={storeName}
                    disabled={storeAlreadyRegistered && !isEditingStore}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      setStoreSaveError('');
                      setStoreSaveMessage('');
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Owner Name</label>
                  <input
                    type="text"
                    value={account?.full_name || ''}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={account?.email || ''}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={account?.phone || ''}
                    readOnly
                  />
                </div>

                <div className="form-group full-width">
                  <label>Store Address</label>
                  <textarea
                    placeholder="Enter complete store address"
                    value={storeAddress}
                    disabled={storeAlreadyRegistered && !isEditingStore}
                    onChange={(e) => {
                      setStoreAddress(e.target.value);
                      setLocationMessage('');
                      setStoreSaveError('');
                      setStoreSaveMessage('');
                    }}
                    required
                  />
                </div>
              </div>

              <div className="setup-title location-title" id="location">
                <span className="step-number">02</span>

                <div>
                  <h3>Store Location</h3>
                  <p>
                    Select your district and search for your store address.
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value="Tamil Nadu"
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>District</label>

                  <select
                    value={district}
                    disabled={storeAlreadyRegistered && !isEditingStore}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setSelectedLocation(null);
                      setSearchPosition(null);
                      setLocationMessage('');
                      setStoreSaveError('');
                      setStoreSaveMessage('');
                    }}
                    required
                  >
                    <option value="">Select district</option>

                    {districts.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="map-instructions">
                <strong>Search your store location</strong>

                <p>
                  {storeAlreadyRegistered && !isEditingStore
                    ? 'Your saved store location is displayed on the map. Click Edit Store Details to change it.'
                    : 'Enter your street, area or nearby landmark above. Select your district and click Search Location. The map will automatically move to the result. You can also click the map or drag the marker to adjust the location.'}
                </p>
              </div>

              <button
                type="button"
                className="save-button"
                onClick={handleLocationSearch}
                disabled={
                  searching ||
                  loadingStoreDetails ||
                  (storeAlreadyRegistered && !isEditingStore)
                }
              >
                {searching ? 'Searching...' : 'Search Location'}
              </button>

              {locationMessage && (
                <p
                  style={{
                    marginTop: '15px',
                    fontSize: '13px',
                    color: selectedLocation ? '#21834B' : '#A83250'
                  }}
                >
                  {locationMessage}
                </p>
              )}

              <div
                className="map-container"
                style={{ marginTop: '20px' }}
              >
                <MapContainer
                  bounds={[
                    [8.0, 76.5],
                    [13.5, 80.5]
                  ]}
                  minZoom={7}
                  maxZoom={18}
                  maxBounds={[
                    [7.5, 75.5],
                    [14.0, 81.0]
                  ]}
                  maxBoundsViscosity={1.0}
                  scrollWheelZoom={true}
                  style={{
                    height: '450px',
                    width: '100%'
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapController searchPosition={searchPosition} />

                  <MapClickHandler
                    setSelectedLocation={setSelectedLocation}
                    enabled={!storeAlreadyRegistered || isEditingStore}
                  />

                  {selectedLocation && (
                    <Marker
                      position={[
                        selectedLocation.lat,
                        selectedLocation.lng
                      ]}
                      icon={storeIcon}
                      draggable={!storeAlreadyRegistered || isEditingStore}
                      eventHandlers={{
                        dragend: (event) => {
                          if (storeAlreadyRegistered && !isEditingStore) {
                            return;
                          }

                          const position = event.target.getLatLng();

                          setSelectedLocation({
                            lat: position.lat,
                            lng: position.lng
                          });
                        }
                      }}
                    />
                  )}
                </MapContainer>
              </div>

              {selectedLocation ? (
                <div className="coordinates">
                  <strong>Selected Store Coordinates</strong>

                  <p>
                    Latitude: {selectedLocation.lat.toFixed(6)}
                  </p>

                  <p>
                    Longitude: {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <p className="location-hint">
                  No location selected yet. Search for your store address
                  to place the marker.
                </p>
              )}

              {storeSaveError && (
                <p style={{ marginTop: '15px', color: '#B42332', fontSize: '13px' }}>
                  {storeSaveError}
                </p>
              )}

              {storeSaveMessage && (
                <p style={{ marginTop: '15px', color: '#21834B', fontSize: '13px' }}>
                  {storeSaveMessage}
                </p>
              )}

              {storeAlreadyRegistered && !isEditingStore ? (
                <button
                  type="button"
                  className="save-button"
                  onClick={handleEditStore}
                  disabled={loadingStoreDetails || savingStore}
                >
                  Edit Store Details
                </button>
              ) : (
                <button
                  type="submit"
                  className="save-button"
                  disabled={savingStore || loadingStoreDetails}
                >
                  {loadingStoreDetails
                    ? 'Loading Store Details...'
                    : savingStore
                      ? storeAlreadyRegistered
                        ? 'Updating...'
                        : 'Saving...'
                      : storeAlreadyRegistered
                        ? 'Update Store Details'
                        : 'Save Store Details'}
                </button>
              )}

              {storeAlreadyRegistered && isEditingStore && (
                <button
                  type="button"
                  className="save-button"
                  style={{
                    marginTop: '10px',
                    background: '#89777D'
                  }}
                  onClick={handleCancelEditing}
                  disabled={savingStore || loadingStoreDetails}
                >
                  {loadingStoreDetails ? 'Loading...' : 'Cancel Editing'}
                </button>
              )}
            </form>
          </div>
        </section>

        <section id="products" style={{ scrollMarginTop: '25px' }}>
          {storeAlreadyRegistered ? (
            <Products />
          ) : (
            <div className="section">
              <div className="section-heading">
                <h2>Products</h2>
                <p>Manage your store inventory.</p>
              </div>

              <div className="setup-card">
                <p>
                  Please register your store first to start adding and
                  managing products.
                </p>
              </div>
            </div>
          )}
        </section>

        <section id="orders" style={{ scrollMarginTop: '25px' }}>
          {storeAlreadyRegistered ? (
            <Orders />
          ) : (
            <div className="section">
              <div className="section-heading">
                <h2>Orders</h2>
                <p>Manage your customer orders.</p>
              </div>

              <div className="setup-card">
                <p>
                  Please register your store first to manage orders.
                </p>
              </div>
            </div>
          )}
        </section>

        <footer>
          © 2026 StoreEase. Store Owner Portal.
        </footer>
      </main>
    </div>
  );
}

const authStyles = {
  page: {
    minHeight: '100vh',
    background: '#F5E8E8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '25px 15px',
    fontFamily: 'Arial, sans-serif'
  },

  card: {
    width: '100%',
    maxWidth: '440px',
    background: '#FFF9F2',
    padding: '38px',
    borderRadius: '16px',
    border: '1px solid #EAD9DC',
    boxShadow: '0 10px 35px rgba(53,35,42,0.08)'
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '28px'
  },

  logoIcon: {
    width: '45px',
    height: '45px',
    background: '#701A32',
    color: 'white',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '25px',
    fontWeight: 'bold'
  },

  brand: {
    color: '#701A32',
    fontSize: '27px'
  },

  subtitle: {
    textAlign: 'center',
    color: '#A83250',
    fontSize: '11px',
    letterSpacing: '1.5px',
    fontWeight: 'bold',
    marginBottom: '12px'
  },

  heading: {
    textAlign: 'center',
    color: '#35232A',
    fontSize: '25px',
    marginBottom: '9px'
  },

  description: {
    textAlign: 'center',
    color: '#89777D',
    fontSize: '13px',
    lineHeight: '1.6',
    marginBottom: '25px'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '17px'
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  label: {
    color: '#35232A',
    fontSize: '13px',
    fontWeight: 'bold'
  },

  input: {
    width: '100%',
    padding: '13px',
    border: '1px solid #EAD9DC',
    borderRadius: '8px',
    fontSize: '14px',
    outlineColor: '#A83250',
    background: 'white',
    color: '#35232A'
  },

  passwordRules: {
    background: '#F8F0F1',
    borderRadius: '9px',
    padding: '13px'
  },

  rulesHeading: {
    color: '#35232A',
    fontWeight: 'bold',
    fontSize: '12px',
    marginBottom: '8px'
  },

  rule: {
    fontSize: '12px',
    marginTop: '6px'
  },

  error: {
    color: '#B42332',
    background: '#FCE8E8',
    padding: '11px',
    borderRadius: '7px',
    fontSize: '12px',
    lineHeight: '1.5'
  },

  success: {
    color: '#21834B',
    background: '#E8F5EC',
    padding: '11px',
    borderRadius: '7px',
    fontSize: '12px'
  },

  button: {
    width: '100%',
    padding: '14px',
    background: '#701A32',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '5px'
  },

  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#89777D',
    marginTop: '23px'
  },

  switchButton: {
    border: 'none',
    background: 'none',
    color: '#A83250',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: '5px',
    fontSize: '13px'
  },

  footer: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#89777D',
    marginTop: '30px'
  },

  logoutButton: {
    padding: '9px 13px',
    background: '#701A32',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  }
};

export default App;
