require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('./socket');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const connectionRoutes = require('./routes/connections');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const https = require('https');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Initialize socket.io
const io = socketIO.init(server);

// Middleware
app.use(cors({
  origin: ['https://brewnet.in', 'https://www.brewnet.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(compression());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Connect to MongoDB
connectDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ userId }) => {
    socket.join(userId);
  });

  socket.on('private message', (message) => {
    io.to(message.receiverId).emit('private message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const options = {
  key: fs.readFileSync('path/to/key.pem'),
  cert: fs.readFileSync('path/to/cert.pem')
};

https.createServer(options, app).listen(443); 