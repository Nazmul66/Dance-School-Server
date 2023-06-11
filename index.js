const express = require('express')
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const verifyToken = (req, res, next) =>{
    const authorization = req.headers.authorization;
    if(!authorization){
         return res.status(401).send({ error: true, message: "sai unauthorized access" })
    }
    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) =>{
        if(err){
          return res.status(403).send({ error: true, message: "bhai Forbidden access" })
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-tfmdlv0-shard-00-00.rnkzyeb.mongodb.net:27017,ac-tfmdlv0-shard-00-01.rnkzyeb.mongodb.net:27017,ac-tfmdlv0-shard-00-02.rnkzyeb.mongodb.net:27017/?ssl=true&replicaSet=atlas-8cmvoo-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const courseCollection = client.db("Dance_School").collection("Cart");
    const userCollection = client.db("Dance_School").collection("user");
    const classCollection = client.db("Dance_School").collection("addClass");


    /// jwt token
    app.post("/jwt", async(req, res) =>{
      const user = req.body;
      // console.log(user)
      const token = jwt.sign(user, process.env.JWT_TOKEN, {
         expiresIn: '1h'
      })
      res.send({ token })
    })

    /// POST user
    app.post("/user", async(req, res)=>{
        const user = req.body;
        console.log(user)
        const query = { email: user.email }
        const existingUser = await userCollection.findOne(query);
        if(existingUser){
          return res.send({message: "Already Added this user info"})
        }
        else{
          const result = await userCollection.insertOne(user);
          res.send(result);
        }
    })

    // GET user
    app.get("/user", async(req, res) =>{
       const result = await userCollection.find().toArray();
       res.send(result)
    })

    /// GET user admin
    app.get("/users/admin/:email", verifyToken, async(req, res) =>{
        const email = req.params.email;
        const query = { email: email}

        const decoded = req.decoded.email;
        if(decoded !== email){
            return res.status(403).send({admin: false})
        }

        const user = await userCollection.findOne(query);
        const result = { admin: user?.role === "admin" }
        res.send(result)
    })

    /// GET user instructor
    app.get("/users/instructor/:email", verifyToken, async(req, res) =>{
      const email = req.params.email;
      const query = { email: email}

      const decoded = req.decoded.email;
      if(decoded !== email){
          return res.status(403).send({instructor: false})
      }

      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" }
      res.send(result)
  })

      /// GET user student
      app.get("/users/student/:email", verifyToken, async(req, res) =>{
        const email = req.params.email;
        const query = { email: email}
  
        const decoded = req.decoded.email;
        if(decoded !== email){
            return res.status(403).send({instructor: false})
        }
  
        const result = await userCollection.findOne(query);
        res.send(result)
    })

    /// PATCH user admin
    app.patch("/users/admin/:id", async(req, res) =>{
        const id = req.params.id;
        // console.log(id);
        const filter = { _id: new ObjectId(id)}
        const updateDoc = {
             $set: {
                role: 'admin',
             }
        }
        const result = await userCollection.updateOne(filter, updateDoc)
        res.send(result)
    })

    /// PATCH user instructor
    app.patch("/users/instructor/:id", async(req, res) =>{
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id)}
      const updateDoc = {
           $set: {
              role: 'instructor',
           }
      }
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
  })

    /// DELETE user admin
    app.delete("/users/admin/:id", async(req, res) =>{
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    /// POST course 
    app.post("/course", async(req, res) =>{
        const body = req.body;
        const result = await courseCollection.insertOne(body)
        res.send(result);
    })

    /// GET course email query
    app.get("/course", verifyToken, async(req, res) =>{
       const email = req.query.email;

       if(!email){
           return res.send([])
       }

       const decoded = req.decoded.email
       if(email !== decoded){
         return res.status(403).send({ error: true, message: "Forbidden access" })
       }

        const query = { email: email };
        const result = await courseCollection.find(query).toArray();
        res.send(result);

    })

    /// DELETE course
    app.delete("/course/:id", async(req, res) =>{
      const id = req.params.id;
      // console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await courseCollection.deleteOne(query)
      res.send(result)
    })

    //GET payments
    app.get("/payment/:id", async(req, res) =>{
      const id = req.params.id;
      // console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await courseCollection.findOne(query)
      res.send(result)
    })

    // dashboard add class POST 
    app.post("/class", async(req, res) =>{
       const body = req.body;
       const result = await classCollection.insertOne(body)
       res.send(result)
    })

    app.get("/class", async(req, res) =>{
        const email = req.query.email;
        if(!email){
          return res.send([])
        }
        const query = { email: email }
        const result = await classCollection.find(query).toArray();
        res.send(result)
    })

    /// all classes GET on class page
    app.get("/classes", async(req, res) =>{
       const result = await classCollection.find().toArray();
       res.send(result)
    })

    /// all instructor page get method
    app.get("/allInstructor", async(req, res) =>{
      const role = req.query.role;
      console.log(role)
      const query = { role: role }
      const result = await userCollection.find(query).toArray();
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})