import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import productivityRoutes from './routes/productivity';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Custom interface to extend WebSocket with isAlive property
interface CustomWebSocket extends WebSocket {
  isAlive: boolean;
}

// Initialize Express app
const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Static files (if any were served in the old version)
if (fs.existsSync(path.join(__dirname, 'public'))) {
  app.use(express.static(path.join(__dirname, 'public')));
}

// API Routes
app.use('/api/productivity', productivityRoutes);

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const { initializeApp } = require("firebase/app");
        const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
    
        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY, // Safe to store on backend
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        };
    
        const firebaseApp = initializeApp(firebaseConfig);
    
        const auth = getAuth(firebaseApp);
    
        // Sign in with email & password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
    
        // Create a Firebase custom token
        // Get the user token
        const token = await user.getIdToken();
        console.log(email, token);
        res.json({ token });
    } 
    catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post("/api/auth/register", async (req, res) => {
    const { email, password, displayName } = req.body;
    try {
        const { initializeApp } = require("firebase/app");
        const { getAuth, createUserWithEmailAndPassword, updateProfile } = require("firebase/auth");

        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        };
    
        const firebaseApp = initializeApp(firebaseConfig);
        const auth = getAuth(firebaseApp);
    
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update the user's display name
        await updateProfile(user, { displayName });
        
        // Get the user token
        const token = await user.getIdToken();
        
        console.log(`New user registered: ${email}, ${displayName}`);
        res.status(201).json({ token });
    } 
    catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  // Cast to our custom interface
  const customWs = ws as CustomWebSocket;
  customWs.isAlive = true;
  
  console.log('Client connected to WebSocket');
  
  // Handle incoming messages
  customWs.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);
      
      // Handle different message types
      switch(data.type) {
        case 'ping':
          customWs.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
          
        case 'productivity_update':
          // Handle productivity updates via WebSocket if needed
          // Broadcast to other clients if necessary
          wss.clients.forEach((client) => {
            if (client !== customWs && client.readyState === customWs.OPEN) {
              client.send(JSON.stringify({
                type: 'productivity_notification',
                data: {
                  userId: data.userId,
                  timestamp: new Date().toISOString()
                }
              }));
            }
          });
          break;
          
        default:
          console.log(`Unhandled message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  // Handle pong messages to keep the connection alive
  customWs.on('pong', () => {
    customWs.isAlive = true;
  });
  
  // Handle client disconnect
  customWs.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
  
  // Send welcome message
  customWs.send(JSON.stringify({ 
    type: 'welcome', 
    message: 'Connected to Racoon WebSocket server',
    timestamp: new Date().toISOString()
  }));
});

// Ping clients periodically to keep connections alive
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const customWs = ws as CustomWebSocket;
    if (customWs.isAlive === false) {
      return ws.terminate();
    }
    
    customWs.isAlive = false;
    ws.ping();
  });
}, 30000);

// Clean up interval on server close
wss.on('close', () => {
  clearInterval(pingInterval);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`WebSocket server initialized`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// For use with import in other files
export default app;
