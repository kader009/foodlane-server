# FoodLane Server

This is the server-side of the **FoodLane** restaurant application, built using Node.js, Express, and MongoDB. The server handles requests, authentication, database interactions, and payment processing with Stripe.

## Dependencies

- **express**: Web framework for building APIs
- **cookie-parser**: Middleware for parsing cookies
- **cors**: Middleware to enable Cross-Origin Resource Sharing
- **dotenv**: For managing environment variables
- **jsonwebtoken**: Used for handling JWT-based authentication
- **mongodb**: MongoDB driver for Node.js
- **stripe**: Stripe API for handling payment integration

## Project Setup

### Prerequisites

- Node.js (v18 or above)
- MongoDB (local or cloud instance)
- Stripe account for payment processing

### Installation

1.  **Clone the repository**:

```bash
git clone https://github.com/kader009/foodlane-server.git
```

2. **download all the dependecies**:

```bash
npm install or yarn add or pnpm install
```

3. **Run this project on your local machine**:

```bash
npm run dev or yarn dev or pnpm run dev
```

### Set up environment variables:

##### Create a .env file in the root directory and add the following environment variables:

```bash
cp env.example to .env

DB_URL=your-db-url-link
TOKEN_SECRET=your-token-secret
STRIPE_SECRET=your-stripe-secret
```
