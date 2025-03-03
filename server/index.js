require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const WebSocket = require("ws");
const cors = require("cors");

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("Client connected");
});

// Endpoint to receive updates from clients
app.post("/update", async (req, res) => {
try {
    const { userId, data } = req.body;
    await db.collection("users").doc(userId).set(data, { merge: true });
    res.status(200).json({ message: "Data updated successfully" });
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

// Broadcast updates to all clients every hour
setInterval(async () => {
try {
    const snapshot = await db.collection("users").get();
    const updates = snapshot.docs.map(doc => ({ userId: doc.id, data: doc.data() }));
    wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ updates }));
    }
    });
} catch (error) {
    console.error("Error sending updates:", error);
}
}, 60 * 60 * 1000); // 1 hour interval

console.log("Express.js server with Firebase is running...");
