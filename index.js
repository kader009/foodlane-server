import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());
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

    app.get('/foodData', async (req, res) => {
      // console.log(req.query.email);
      let query = {};

      if (req.query?.email) {
        query = { 'addBy.email': req.query.email };
      }

      const result = await FoodCollection.find(query).toArray();

      res.send(result);
    });

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

    app.get('/orders', async (req, res) => {
      console.log(req.query.email);
      // const order = req.body;
      let query = {};
      if (req?.query?.email) {
        query = { buyerEmail: req.query.email };
      }
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const result = await orderCollection.deleteOne({_id: new ObjectId(id)});
      res.send(result)
    });

    app.get('/foodData/get/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const result = await FoodCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

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
