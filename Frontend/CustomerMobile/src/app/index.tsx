import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Use your laptop's Wi-Fi IPv4 address, not localhost.
const API_URL = 'http://10.211.242.137:5000/api';

export default function Index() {
  const [screen, setScreen] = useState('login');
  const [isRegister, setIsRegister] = useState(false);

  // Customer authentication
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [customer, setCustomer] = useState<any>(null);

  // Stores fetched from MySQL
  const [stores, setStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [storeError, setStoreError] = useState('');

  // Products fetched from the selected store
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState('');

  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Retrieve registered stores from the backend
  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      setStoreError('');

      const response = await fetch(`${API_URL}/stores`);

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const data = await response.json();
      setStores(Array.isArray(data.stores) ? data.stores : []);
    } catch (error) {
      console.error('Store loading error:', error);
      setStoreError(
        'Unable to load stores. Please check your internet connection and backend server.'
      );
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Retrieve products belonging to the selected store
  const fetchProducts = async (store: any) => {
    try {
      setLoadingProducts(true);
      setProductError('');
      setProducts([]);

      const response = await fetch(
        `${API_URL}/products/store/${store.store_id}`
      );

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const data = await response.json();

      const formattedProducts = Array.isArray(data.products)
        ? data.products.map((product: any) => ({
          id: product.product_id,
          storeId: product.store_id,
          name: product.product_name,
          category: product.category_name || 'General',
          brand: product.brand || '',
          description: product.description || '',
          price: Number(product.price),
          unit: product.unit_label || '',
          stock: Number(product.available_quantity) || 0,
        }))
        : [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Product loading error:', error);
      setProductError(
        'Unable to load products. Please check your backend server and try again.'
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // Customer registration and login
  const handleAuthentication = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (isRegister) {
      if (!fullName.trim() || !cleanEmail || !phone.trim() || !password) {
        Alert.alert('Missing details', 'Please fill in all the fields.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }

      if (!/^\d{10}$/.test(phone.trim())) {
        Alert.alert(
          'Invalid Phone Number',
          'Please enter a valid 10-digit phone number.'
        );
        return;
      }

      if (password.length < 8) {
        Alert.alert(
          'Weak Password',
          'Password must contain at least 8 characters.'
        );
        return;
      }

      if (!/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        Alert.alert(
          'Weak Password',
          'Password must contain at least one number and one special character.'
        );
        return;
      }
    } else {
      if (!cleanEmail || !password) {
        Alert.alert('Missing details', 'Please enter your email and password.');
        return;
      }
    }

    try {
      setAuthLoading(true);

      const endpoint = isRegister
        ? `${API_URL}/auth/customer/register`
        : `${API_URL}/auth/customer/login`;

      const requestBody = isRegister
        ? {
          full_name: fullName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          password,
        }
        : {
          email: cleanEmail,
          password,
        };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      if (isRegister) {
        Alert.alert(
          'Registration Successful',
          'Your customer account has been created. Please log in.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsRegister(false);
                setPassword('');
              },
            },
          ]
        );
      } else {
        if (!data.token) {
          throw new Error(
            'Login succeeded but no authentication token was received.'
          );
        }

        await SecureStore.setItemAsync('customerToken', data.token);

        setAuthToken(data.token);
        setCustomer(data.user || null);
        setPassword('');
        setScreen('stores');

        Alert.alert('Welcome!', 'You have logged in successfully.');

        fetchStores();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);

      Alert.alert(
        'Authentication Failed',
        error.message || 'Unable to connect to the server. Please try again.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const deliveryEligible = subtotal >= 1000;
  const total = subtotal;

  // Add a product to cart
  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem && existingItem.quantity >= product.stock) {
      Alert.alert(
        'Stock Limit',
        'You cannot add more than the available stock.'
      );
      return;
    }

    setCart(previous => {
      const existing = previous.find(item => item.id === product.id);

      if (existing) {
        return previous.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previous, { ...product, quantity: 1 }];
    });

    Alert.alert('Added to Cart', `${product.name} added successfully.`);
  };

  const changeQuantity = (id: number, amount: number) => {
    setCart(previous =>
      previous
        .map(item => {
          if (item.id !== id) return item;

          const newQuantity = item.quantity + amount;

          if (newQuantity > item.stock) {
            Alert.alert(
              'Stock Limit',
              'Only the available quantity can be added.'
            );
            return item;
          }

          return { ...item, quantity: newQuantity };
        })
        .filter(item => item.quantity > 0)
    );
  };

  // Retrieve the logged-in customer's real orders from MySQL
  const fetchCustomerOrders = async () => {
    try {
      const token =
        authToken || (await SecureStore.getItemAsync('customerToken'));

      if (!token) {
        throw new Error('Please log in again to view your orders.');
      }

      const response = await fetch(`${API_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load your orders.');
      }

      // The API returns one row per order item. Group items under each order.
      const groupedOrders = (Array.isArray(data.orders) ? data.orders : [])
        .reduce((grouped: any, row: any) => {
          if (!grouped[row.order_id]) {
            grouped[row.order_id] = {
              id: row.order_id,
              storeId: row.store_id,
              amount: Number(row.total_amount),
              status: row.order_status,
              paymentStatus: row.payment_status,
              delivery: row.delivery_method,
              address: row.delivery_address,
              items: [],
              createdAt: row.created_at,
            };
          }

          if (row.order_item_id) {
            grouped[row.order_id].items.push({
              name: row.product_name,
              quantity: row.quantity,
              price: Number(row.unit_price),
              subtotal: Number(row.subtotal),
            });
          }

          return grouped;
        }, {});

      setOrders(Object.values(groupedOrders));
    } catch (error: any) {
      console.error('Customer orders error:', error);
      Alert.alert('Orders', error.message || 'Unable to load your orders.');
    }
  };

  // Save a real order in MySQL. Payment remains pending until a gateway is connected.
  const placeCustomerOrder = () => {
    if (cart.length === 0 || !selectedStore) {
      Alert.alert('Empty Cart', 'Please add products before placing an order.');
      return;
    }

    const selectedDeliveryMethod = deliveryEligible
      ? deliveryMethod
      : 'pickup';

    if (selectedDeliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert(
        'Delivery Address Required',
        'Please enter your delivery address.'
      );
      return;
    }

    Alert.alert(
      'Place Order?',
      'Your order will be saved. Online payment is not connected yet, so payment status will remain pending.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: async () => {
            try {
              setOrderLoading(true);

              const token =
                authToken || (await SecureStore.getItemAsync('customerToken'));

              if (!token) {
                throw new Error(
                  'Your login session has expired. Please log in again.'
                );
              }

              const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  store_id: selectedStore.store_id,
                  delivery_method: selectedDeliveryMethod,
                  delivery_address:
                    selectedDeliveryMethod === 'delivery'
                      ? deliveryAddress.trim()
                      : null,
                  items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                  })),
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message || 'Unable to place your order.');
              }

              setCart([]);
              setDeliveryAddress('');
              setDeliveryMethod('delivery');
              setScreen('orders');

              await fetchCustomerOrders();
              await fetchProducts(selectedStore);

              Alert.alert(
                'Order Saved!',
                `Your order #${data.order_id} has been saved successfully. Payment status: Pending.`
              );
            } catch (error: any) {
              console.error('Place order error:', error);
              Alert.alert(
                'Order Failed',
                error.message || 'Unable to place your order. Please try again.'
              );
            } finally {
              setOrderLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open a selected store and load its products
  const openStore = (store: any) => {
    if (cart.length > 0 && selectedStore?.store_id !== store.store_id) {
      Alert.alert(
        'Change Store?',
        'Your current cart belongs to another store. Changing stores will clear it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              setCart([]);
              setSelectedStore(store);
              setProductSearch('');
              setScreen('products');
              fetchProducts(store);
            },
          },
        ]
      );
      return;
    }

    setSelectedStore(store);
    setProductSearch('');
    setScreen('products');
    fetchProducts(store);
  };

  const navButton = (label: string, target: string) => (
    <TouchableOpacity
      style={styles.navButton}
      onPress={() => {
        if (target === 'stores') {
          fetchStores();
        }
        if (target === 'orders') {
          fetchCustomerOrders();
        }
        setScreen(target);
      }}
    >
      <Text style={styles.navText}>{label}</Text>
    </TouchableOpacity>
  );

  const filteredProducts = products.filter(product =>
    `${product.name} ${product.category} ${product.brand}`
      .toLowerCase()
      .includes(productSearch.toLowerCase().trim())
  );

  const filteredStores = stores.filter(store =>
    `${store.store_name || ''} ${store.store_address || ''} ${store.district || ''}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  if (screen === 'login') {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.logo}>StoreEase</Text>
        <Text style={styles.tagline}>Your stores, just a tap away.</Text>

        <View style={styles.authCard}>
          <Text style={styles.heading}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </Text>

          <Text style={styles.subtitle}>
            {isRegister
              ? 'Register to start shopping'
              : 'Login to continue shopping'}
          </Text>

          {isRegister && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#89777D"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#89777D"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#89777D"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#89777D"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              authLoading && styles.disabledButton,
            ]}
            onPress={handleAuthentication}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegister ? 'Register' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsRegister(!isRegister);
              setPassword('');
            }}
            disabled={authLoading}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logoSmall}>StoreEase</Text>
          <Text style={styles.headerSubtitle}>Shopping made simple</Text>
          <Text style={styles.cartCount}>Cart: {cart.length}</Text>
        </View>

        <TouchableOpacity
          onPress={async () => {
            await SecureStore.deleteItemAsync('customerToken');
            setAuthToken('');
            setCustomer(null);
            setCart([]);
            setDeliveryAddress('');
            setDeliveryMethod('delivery');
            setOrders([]);
            setSelectedStore(null);
            setIsRegister(false);
            setFullName('');
            setEmail('');
            setPhone('');
            setPassword('');
            setScreen('login');
            Alert.alert('Logged Out', 'You have logged out successfully.');
          }}
          style={{
            backgroundColor: '#FFF9F2',
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#701A32', fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {screen === 'stores' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Explore Stores</Text>
          <Text style={styles.subtitle}>
            Find your favourite local stores.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Search stores or districts..."
            placeholderTextColor="#89777D"
            value={search}
            onChangeText={setSearch}
          />

          {loadingStores ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#701A32" />
              <Text style={styles.subtitle}>Loading registered stores...</Text>
            </View>
          ) : storeError ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>{storeError}</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={fetchStores}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredStores.length === 0 ? (
            <Text style={styles.subtitle}>
              {stores.length === 0
                ? 'No stores have been registered yet.'
                : 'No matching stores found.'}
            </Text>
          ) : (
            filteredStores.map(store => (
              <TouchableOpacity
                key={store.store_id}
                style={styles.card}
                onPress={() => openStore(store)}
              >
                <Text style={styles.cardTitle}>{store.store_name}</Text>
                <Text style={styles.cardText}>{store.store_address}</Text>
                <Text style={styles.cardText}>{store.district}</Text>

                {store.store_phone ? (
                  <Text style={styles.cardText}>
                    Phone: {store.store_phone}
                  </Text>
                ) : null}

                <Text style={styles.linkText}>View Products →</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {screen === 'products' && (
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => setScreen('stores')}>
            <Text style={styles.linkText}>← Back to Stores</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>{selectedStore?.store_name}</Text>
          <Text style={styles.subtitle}>Available Products</Text>

          <TextInput
            style={styles.input}
            placeholder="Search products..."
            placeholderTextColor="#89777D"
            value={productSearch}
            onChangeText={setProductSearch}
          />

          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#701A32" />
              <Text style={styles.subtitle}>Loading store products...</Text>
            </View>
          ) : productError ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>{productError}</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => fetchProducts(selectedStore)}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredProducts.length === 0 ? (
            <Text style={styles.subtitle}>
              {products.length === 0
                ? 'This store has not added any products yet.'
                : 'No matching products found. Try another search.'}
            </Text>
          ) : (
            filteredProducts.map(product => (
              <View key={product.id} style={styles.card}>
                <Text style={styles.cardTitle}>{product.name}</Text>
                <Text style={styles.cardText}>
                  Category: {product.category}
                </Text>

                {product.brand ? (
                  <Text style={styles.cardText}>Brand: {product.brand}</Text>
                ) : null}

                {product.description ? (
                  <Text style={styles.cardText}>{product.description}</Text>
                ) : null}

                <Text style={styles.cardText}>{product.unit}</Text>
                <Text style={styles.price}>₹{product.price}</Text>

                <Text style={styles.cardText}>
                  Available stock: {product.stock}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.smallButton,
                    product.stock <= 0 && styles.disabledButton,
                  ]}
                  disabled={product.stock <= 0}
                  onPress={() => addToCart(product)}
                >
                  <Text style={styles.primaryButtonText}>
                    {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {screen === 'cart' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>My Cart</Text>

          {cart.length === 0 ? (
            <Text style={styles.subtitle}>Your cart is empty.</Text>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Store: {selectedStore?.store_name}
              </Text>

              {cart.map(item => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardText}>
                    ₹{item.price} × {item.quantity}
                  </Text>

                  <View style={styles.quantityRow}>
                    <TouchableOpacity
                      onPress={() => changeQuantity(item.id, -1)}
                    >
                      <Text style={styles.quantityButton}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.cardTitle}>{item.quantity}</Text>

                    <TouchableOpacity
                      onPress={() => changeQuantity(item.id, 1)}
                    >
                      <Text style={styles.quantityButton}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <Text style={styles.totalText}>Subtotal: ₹{subtotal}</Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setScreen('checkout')}
              >
                <Text style={styles.primaryButtonText}>
                  Proceed to Checkout
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {screen === 'checkout' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Checkout</Text>

          <Text style={styles.subtitle}>
            Store: {selectedStore?.store_name}
          </Text>

          <Text style={styles.cardText}>Product amount: ₹{subtotal}</Text>

          {deliveryEligible ? (
            <>
              <Text style={styles.cardTitle}>Choose fulfilment method</Text>

              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={[
                    styles.smallButton,
                    {
                      flex: 1,
                      backgroundColor:
                        deliveryMethod === 'delivery' ? '#701A32' : '#89777D',
                    },
                  ]}
                  onPress={() => setDeliveryMethod('delivery')}
                >
                  <Text style={styles.primaryButtonText}>Delivery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.smallButton,
                    {
                      flex: 1,
                      backgroundColor:
                        deliveryMethod === 'pickup' ? '#701A32' : '#89777D',
                    },
                  ]}
                  onPress={() => setDeliveryMethod('pickup')}
                >
                  <Text style={styles.primaryButtonText}>Store Pickup</Text>
                </TouchableOpacity>
              </View>

              {deliveryMethod === 'delivery' ? (
                <>
                  <Text style={styles.cardTitle}>Delivery Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your complete delivery address"
                    placeholderTextColor="#89777D"
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    multiline
                  />
                  <Text style={styles.cardText}>
                    Delivery is subject to delivery partner availability.
                  </Text>
                  <Text style={styles.cardText}>
                    Delivery charge and road distance calculation will be connected next.
                  </Text>
                </>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Store Pickup</Text>
                  <Text style={styles.cardText}>
                    You will collect your order from the selected store.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Store Pickup</Text>
              <Text style={styles.cardText}>
                Orders below ₹1,000 must be collected from the selected store.
              </Text>
            </View>
          )}

          <Text style={styles.totalText}>Total: ₹{total}</Text>

          <Text style={styles.cardText}>
            Payment method: Online payment only
          </Text>
          <Text style={styles.cardText}>
            Payment gateway is not connected yet. The order will be saved with payment status Pending.
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, orderLoading && styles.disabledButton]}
            onPress={placeCustomerOrder}
            disabled={orderLoading}
          >
            {orderLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Place Order (Payment Pending)
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {screen === 'orders' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>My Orders</Text>

          <TouchableOpacity onPress={fetchCustomerOrders}>
            <Text style={styles.linkText}>Refresh Orders ↻</Text>
          </TouchableOpacity>

          {orders.length === 0 ? (
            <Text style={styles.subtitle}>You have no orders yet.</Text>
          ) : (
            orders.map(order => (
              <View key={order.id} style={styles.card}>
                <Text style={styles.cardTitle}>Order #{order.id}</Text>
                <Text style={styles.cardText}>Store ID: {order.storeId}</Text>
                <Text style={styles.cardText}>Amount: ₹{order.amount}</Text>
                <Text style={styles.cardText}>Order Status: {order.status}</Text>
                <Text style={styles.cardText}>Payment Status: {order.paymentStatus}</Text>
                <Text style={styles.cardText}>
                  Fulfilment: {order.delivery === 'delivery' ? 'Delivery' : 'Store Pickup'}
                </Text>
                {order.address ? (
                  <Text style={styles.cardText}>Delivery Address: {order.address}</Text>
                ) : null}
                <Text style={styles.cardTitle}>Items</Text>
                {order.items.map((item: any, index: number) => (
                  <Text key={`${order.id}-${index}`} style={styles.cardText}>
                    {item.name} × {item.quantity} — ₹{item.subtotal}
                  </Text>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        {navButton('Stores', 'stores')}
        {navButton('Cart', 'cart')}
        {navButton('Orders', 'orders')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E8E8' },
  authContainer: {
    flex: 1,
    backgroundColor: '#F5E8E8',
    justifyContent: 'center',
    padding: 24,
  },
  authCard: {
    backgroundColor: '#FFF9F2',
    padding: 22,
    borderRadius: 18,
    marginTop: 30,
  },
  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#701A32',
    textAlign: 'center',
  },
  logoSmall: { fontSize: 25, fontWeight: 'bold', color: '#FFF9F2' },
  tagline: { textAlign: 'center', color: '#89777D', marginTop: 8 },
  header: {
    backgroundColor: '#701A32',
    padding: 20,
    paddingTop: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: { color: '#F5E8E8', fontSize: 12, marginTop: 4 },
  cartCount: { color: '#FFF9F2', fontWeight: 'bold' },
  content: { padding: 18, paddingBottom: 35 },
  loadingContainer: {
    alignItems: 'center',
    padding: 25,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#701A32',
    marginBottom: 8,
  },
  subtitle: { color: '#89777D', marginBottom: 18 },
  input: {
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: '#EAD9DC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    color: '#35232A',
  },
  primaryButton: {
    backgroundColor: '#701A32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  switchText: { color: '#A83250', textAlign: 'center', marginTop: 18 },
  card: {
    backgroundColor: '#FFF9F2',
    borderRadius: 13,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAD9DC',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#35232A',
    marginBottom: 7,
  },
  cardText: { color: '#89777D', marginBottom: 6 },
  linkText: { color: '#A83250', fontWeight: 'bold', marginTop: 10 },
  price: {
    color: '#701A32',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  smallButton: {
    backgroundColor: '#701A32',
    padding: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#89777D',
  },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  quantityButton: { fontSize: 25, color: '#A83250', fontWeight: 'bold' },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#701A32',
    marginVertical: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF9F2',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#EAD9DC',
  },
  navButton: { paddingHorizontal: 12, paddingVertical: 5 },
  navText: { color: '#701A32', fontWeight: 'bold' },
});