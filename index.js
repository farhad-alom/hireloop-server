import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
}));

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

// Derive the authenticated user from the better-auth session cookie.
async function getSessionUser(req) {
    const sessionCookie = (req.headers.cookie || "")
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("better-auth.session_token=") || part.startsWith("__Secure-better-auth.session_token="));

    if (!sessionCookie) return null;

    const token = decodeURIComponent(sessionCookie.split("=")[1]).split(".")[0];
    const session = await database.collection("session").findOne({ token });

    if (!session || new Date(session.expiresAt) < new Date()) return null;

    return database.collection("user").findOne({ _id: new ObjectId(String(session.userId)) });
}

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.get('/users', async (req, res) => {
    const cursor = userCollections.find({});
    const result = await cursor.toArray();
    res.send(result);
})

app.get('/jobs', async (req, res) => {
    const cursor = jobs.find({});
    const result = await cursor.toArray();
    res.send(result)
})

app.post('/jobs', async (req, res) => {
    const job = {
        ...req.body,
        status: "active",
        createdAt: new Date(),
    };

    const result = await jobs.insertOne(job);
    res.send(result);
})

app.get('/jobs/:id', async (req, res) => {
    const job = await jobs.findOne({ _id: new ObjectId(req.params.id) });
    res.send(job);
})

app.put('/jobs/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const { _id, recruiterId, status, createdAt, ...updates } = req.body;

    const result = await jobs.updateOne(query, { $set: updates });
    res.send(result);
})

app.delete('/jobs/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await jobs.deleteOne(query);
    res.send(result);
})



app.listen(port, () => {
    console.log(`The server is running on port: ${port}`);
});

