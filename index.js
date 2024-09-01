import { MongoClient, ServerApiVersion } from 'mongodb';
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

    app.get('/foodData', async (req, res) => {
      const result = await FoodCollection.find().toArray();

      res.send(result);
    });

    app.get('/foodDataCount', async (req, res) => {
      const count = await FoodCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // user post request
    app.post('/user', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
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
