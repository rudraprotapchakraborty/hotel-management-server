const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y7jbt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const userCollection = client.db('hotelDb').collection('users');
    const mealCollection = client.db('hotelDb').collection('meal');
    const reviewCollection = client.db('hotelDb').collection('reviews');
    const cartCollection = client.db('hotelDb').collection('carts');

    // Endpoint: Get all users
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        res.send({ message: 'User already exists' });
        return;
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Endpoint: Get all meals with search, filter, and pagination
    app.get('/meal', async (req, res) => {
      const { search = '', category = '', minPrice = 0, maxPrice = 50, page = 1, limit = 10 } = req.query;

      const query = {
        ...(search && { name: { $regex: search, $options: 'i' } }),
        ...(category && { category }),
        price: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) },
      };

      const options = {
        skip: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
      };

      const cursor = mealCollection.find(query, options);
      const meal = await cursor.toArray();
      res.send(meal);
    });

    // Endpoint: Get reviews
    app.get('/reviews', async (req, res) => {
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // Endpoint: Get cart
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hotel Management Server is running');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
