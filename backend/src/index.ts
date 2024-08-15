import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes'; // Import new user routes
import chatRoutes from './routes/chatRoutes'; // Import new chat routes
import groupRoutes from './routes/groupRoutes';  // Import new group routes
import http from 'http';
import WebSocket from 'ws';
import multer from 'multer';
import path from 'path';


// Create an Express application
const app = express();
const upload = multer({ dest: 'uploads/' }); // Ensure the 'uploads' directory exists
const port = process.env.PORT || 4000;

// Set up CORS and body parser
app.use(cors());
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Use new user routes
app.use('/api/chats', chatRoutes); // Use new chat routes
app.use('/api/groups', groupRoutes);  // Use new group routes


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create an HTTP server and attach the Express app to it
const server = http.createServer(app);

// Create a WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ server });

// Array to keep track of connected clients
const clients = new Map<WebSocket, WebSocket>();

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Handle incoming messages
    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
        // Broadcast message to all connected clients
        for (const client of clients.values()) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    // Add the new client to the clients map
    clients.set(ws, ws);
});



// Set up multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
    
// Route to handle file upload
app.post('/api/uploads', upload.single('file'), (req, res) => {
    console.log('Uploaded file:', req.file); // Log the uploaded file details
    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }
  
    // Generate a URL or path to access the file
    const fileUrl = `/uploads/${file.filename}`;
    
    // Respond with the file URL
    res.json({ fileUrl });
  });

  app.use('/uploads', express.static('uploads'));

// Start the HTTP server and WebSocket server on the same port
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
