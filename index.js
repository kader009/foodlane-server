import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://food-lane-zeta.vercel.app'],
    credentials: true,
  })
);
app.use(cookieParser());
dotenv.config();

// initailize stripe
const stripe = new Stripe(process.env.STRIPE_SECRET);

// middleware add
const logger = (req, res, next) => {
  next();
};

// const VerifyToken = async (req, res, next) => {
//   const token = req.cookies?.token; // Get token from cookies
//   console.log('value of token:', token);

//   // If token is not present, respond with unauthorized
//   if (!token) {
//     return res.status(401).send({ message: 'unauthorized' });
//   }

//   // Verify the JWT token
//   jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       // Check if the error is due to token expiration
//       if (err.name === 'TokenExpiredError') {
//         res.clearCookie('token');

//         // Respond with token expired message and status 401
//         return res.status(401).send({ message: 'token expired' });
//       }

//       // If any other error occurs, return unauthorized
//       return res.status(401).send({ message: 'unauthorized' });
//     }

//     // If token is valid, attach the user to the request object
//     console.log('value in the token:', decoded);
//     req.user = decoded;

//     // Proceed to the next middleware or route handler
//     next();
//   });
// };

const uri = process.env.DB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db('Foodlane');
    const FoodCollection = database.collection('foodData');
    const userCollection = database.collection('User');
    const orderCollection = database.collection('Order');
    const paymentCollection = database.collection('payment');

    // jwt implement
    // app.post('/jwt', (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.TOKEN_SECRET, {
    //     expiresIn: '1h',
    //   });
    //   console.log(token);
    //   res
    //     .cookie('token', token, {
    //       httpOnly: true,
    //       secure: false,
    //       sameSite: true,
    //     })
    //     .send({ success: true });
    // });

    // get food data with query
    app.get('/foodData', async (req, res) => {
      let query = {};

      if (req.query?.email) {
        query = { 'addBy.email': req.query.email };
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalItems = await FoodCollection.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      const result = await FoodCollection.find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      // new update

      res.send({
        foods: result,
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
      });
    });

    // food data by single id
    app.get('/foodData/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await FoodCollection.findOne(query);
      res.send(result);
    });

    // post fooddata
    app.post('/foodData', async (req, res) => {
      const food = req.body;
      const result = await FoodCollection.insertOne(food);
      res.send(result);
    });

    // order post route
    app.post('/orders', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // get orders
    app.get('/orders', logger, async (req, res) => {
      // if (req.query.email !== req.user.email) {
      //   return res.status(403).send({ message: 'forbidden access' });
      // }

      let query = {};

      if (req?.query?.email) {
        query = { buyerEmail: req.query.email };
      }
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    // delete single order by id
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const result = await orderCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // get food data with speacial params and id
    app.get('/foodData/get/:id', async (req, res) => {
      const id = req.params.id;
      const result = await FoodCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // update food data by single id
    app.patch('/foodData/:id', async (req, res) => {
      const id = req.params.id;
      const updateFood = req.body;
      const result = await FoodCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFood }
      );
      res.send(result);
    });

    // user post request
    app.post('/user', async (req, res) => {
      const user = req.body;
      const exists = await userCollection.findOne({ email: user?.email });

      if (exists?._id) {
        return res.send('user already exists');
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // users related api
    app.get('/user', logger, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // login user
    app.post('/login', async (req, res) => {
      const { email, password } = req.body;

      const user = await userCollection.findOne({ email });

      if (!user) {
        res.status(404).send({ error: 'user not found' });
      }

      if (user.password !== password) {
        res.status(401).send({ error: 'invalid password' });
      }

      res.send(user);
    });

    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;

      if (!price || isNaN(price)) {
        return res
          .status(400)
          .send({ error: 'Invalid price sent from client' });
      }

      const amount = parseInt(price * 100);
      console.log('from server', amount);

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card'],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).send({ error: 'Payment intent creation failed' });
      }
    });

    // payment
    app.post('/payment', async (req, res) => {
      const payment = req.body;
      const email = payment.email; // Assume the user's email is part of the payment object

      try {
        const paymentResult = await paymentCollection.insertOne(payment);

        // Fetch all orders for the user from the orderCollection
        const userOrders = await orderCollection
          .find({ buyerEmail: email })
          .toArray();

        // If the user has no orders, return an error
        if (!userOrders || userOrders.length === 0) {
          return res
            .status(404)
            .send({ error: 'No orders found for the user' });
        }

        // Update the payment document with the user's orders
        await paymentCollection.updateOne(
          { _id: paymentResult.insertedId },
          { $set: { orders: userOrders } }
        );

        // Delete the user's orders from the orderCollection after successful payment
        const deleteResult = await orderCollection.deleteMany({
          buyerEmail: email,
        });

        console.log(
          `Deleted ${deleteResult.deletedCount} orders for the user ${email}`
        );

        res.send({
          success: true,
          message: 'Payment processed and orders cleared',
        });
      } catch (error) {
        console.error('Error processing payment and clearing orders:', error);
        res.status(500).send({ error: 'Payment processing failed' });
      }
    });

    // payment get
    app.get('/payment/:email', async (req, res) => {
      const query = { email: req?.params?.email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Restaurant server is on');
});

app.listen(port, (req, res) => {
  console.log(`restaurant is on port ${port}`);
});

export default app;