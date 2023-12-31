const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;
// middleware
const corsOptions ={
  origin:'*', 
  credentials:true,
  optionSuccessStatus:200,
}
app.use(cors(corsOptions));
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token use
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-ytdlcug-shard-00-00.lvcap8y.mongodb.net:27017,ac-ytdlcug-shard-00-01.lvcap8y.mongodb.net:27017,ac-ytdlcug-shard-00-02.lvcap8y.mongodb.net:27017/?ssl=true&replicaSet=atlas-j6c9nb-shard-0&authSource=admin&retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {
         // await client.connect();
    // Send a ping to confirm a successful connection
    const usersCollection = client.db("projectDb").collection("users");
    const projectsCollection = client.db("projectDb").collection("projects");

      // Connect the client to the server	(optional starting in v4.7)  
//   const usersCollection = client.db("projectDb").collection("users");

  app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
      res.send({ token })
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'porbidden message' });
      }
      next();
    }

  app.post('/users',async (req, res) => {
    const user = req.body;
    const query = { email: user.email }
    const existingUser = await usersCollection.findOne(query);
    if (existingUser) {
      return res.send({ message: 'user already exists' })
    }
    const result = await usersCollection.insertOne(user);
    res.send(result);
  });
  app.get('/users', async (req, res) => {
    const result = await usersCollection.find().toArray();
    res.send(result);
  });
//  all project
  app.post('/projects', async (req, res) => {
    const newItem = req.body;
    const result = await projectsCollection.insertOne(newItem)
    res.send(result);
  })
  app.get('/projects',  async (req, res) => {
    const result = await projectsCollection.find().toArray();
    res.send(result);
  });
   // approved api
   app.patch('/project/approved/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: 'approved'
      },
    };
    const result = await projectsCollection.updateOne(filter, updateDoc);
    res.send(result);
  })
  app.get('/project', async (req, res) => {
    const query = {role: 'approved'}
    const result = await projectsCollection.find(query).toArray();
    res.send(result);
  })
  app.get("/projectNameSearch/:text", async (req, res) => {
    const text = req.params.text;
    // console.log(text)
    const result = await projectsCollection
      .find({
        $or: [{ projectName: { $regex: text, $options: "i" } }],
      })
      .toArray();
    res.send(result);
  });
  app.get('/viewdetails/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await projectsCollection.findOne(query);
    res.send(result)
  })
    // update
    app.get('/update/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await projectsCollection.findOne(query);
      res.send(result)
    })
    app.put('/update/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updatedtoy = req.body;
      const project = {
        $set: {
          projectDetails: updatedtoy.projectDetails,
          projectName: updatedtoy.projectName,
          usedTechnology: updatedtoy.usedTechnology
        }
      }
      const result = await projectsCollection.updateOne(filter, project, options);
      res.send(result)
    })
  app.patch('/project/denied/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: 'denied'
      },
    };
    const result = await projectsCollection.updateOne(filter, updateDoc);
    res.send(result);
  })
   // for get admin email
   app.get('/users/admin/:email',verifyJWT, async (req, res) => {
    const email = req.params.email;
    if (req.decoded.email !== email) {
      res.send({ admin: false })
    }
    const query = { email: email }
    const user = await usersCollection.findOne(query);
    const result = { admin: user?.role === 'admin' }
    res.send(result);
  })
  // role
  app.patch('/users/admin/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: 'admin'
      },
    };
    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);
  })
  // perform actions on the collection object
//   client.close();
//  // await client.db("admin").command({ ping: 1 });
console.log("Pinged your deployment. You successfully connected to MongoDB!");
} finally {
  // Ensures that the client will close when you finish/error
  // await client.close();
}
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('project running')
  })
  app.listen(port, () => {
    console.log(`programmer girl sitting on port ${port}`);
  })