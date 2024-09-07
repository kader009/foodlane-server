import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb'; 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);
app.use(cookieParser());
dotenv.config();

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

    // jwt implement
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: '1h',
      });
      console.log(token);
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,
          sameSite: true,
        })
        .send({ success: true });
    });

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
    app.get('/orders', async (req, res) => {
      console.log(req.query.email);
      console.log('token', req.cookies.token);
      // const order = req.body;
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
      // console.log(id);
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
      const { email } = user;
      const exists = await userCollection.findOne({ email });

      if (exists) {
        return res.send('user already exists');
      }

      const result = await userCollection.insertOne(user);
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
