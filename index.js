import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}
const connectedClient = await connectToMongoDB();
const database = connectedClient.db("hireloop-db");
const userCollections = database.collection("user");
const jobs = database.collection("jobs");

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.get('/users', async (req, res) => {
    const cursor = userCollections.find({});
    const result = await cursor.toArray();
    res.send(result);
})

// jobs Related API's
app.post('/jobs', async (req, res) => {
    const job = req.body;
    const result = await jobs.insertOne(job);
    res.send(result);
})

app.listen(port, () => {
    console.log(`The server is running on port: ${port}`);
});

