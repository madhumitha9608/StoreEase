\# StoreEase – Customer Store Management System



StoreEase is a customer-store management platform developed to connect customers with registered local stores. It allows customers to explore stores, browse products, place orders and track order status. Store owners can manage their stores, products and customer orders.



\## Project Status



Currently under development as part of an internship project at Stonebase Private Limited.



\## Project Modules



\### 1. Customer Application

\- Customer registration and login.

\- Explore registered stores.

\- Browse products belonging to selected stores.

\- Search products.

\- Add products to cart and manage quantities.

\- Checkout with pickup or delivery selection.

\- Place orders.

\- View order history and order status.



\### 2. Store Owner Application

\- Store owner registration and login.

\- Store management.

\- Product management.

\- View customer orders.

\- Update order status.



\### 3. Delivery Application

\- Delivery module frontend is under development.



\### 4. Backend

\- REST API development using Node.js and Express.js.

\- MySQL database integration.

\- Authentication using JWT.

\- Password hashing using bcrypt.

\- Customer and store owner order management.

\- Product stock updates during order creation.



\### 5. Customer Mobile Application

\- Developed using React Native and Expo.

\- Customer authentication.

\- Store and product browsing.

\- Shopping cart.

\- Checkout and order placement.

\- Order history and status tracking.



\## Technologies Used



\- HTML

\- CSS

\- JavaScript

\- React.js

\- React Native

\- Expo

\- Node.js

\- Express.js

\- MySQL

\- Git and GitHub



\## Order and Delivery Rules



\- Online payment is the intended payment method.

\- Delivery is available for orders of ₹1,000 or more.

\- Orders below ₹1,000 require store pickup.

\- Delivery charge calculation based on distance is planned for integration.



\## Current Development Status



The customer mobile application and backend order workflow have been tested successfully.



The following features are still under development:

\- Online payment gateway integration.

\- Map-based distance calculation.

\- Automatic delivery charge calculation.

\- Delivery partner workflow.

\- Further testing and integration.



Note: Payment processing and automatic distance-based delivery charge calculation are not yet implemented. Orders currently use pending payment status.



\## Project Structure



```text

Customer-Store Management System/

│

├── Backend/

│   ├── config/

│   ├── controllers/

│   ├── middleware/

│   ├── routes/

│   └── server.js

│

├── Frontend/

│   ├── Customer/

│   ├── CustomerMobile/

│   ├── Store/

│   └── Delivery/

│

├── .gitignore

└── README.md

