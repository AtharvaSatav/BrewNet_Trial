const { Server } = require('socket.io');
let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: ['https://brewnet.in', 'https://www.brewnet.in'],
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join', ({ userId }) => {
        if (userId) {
          socket.join(userId);
          console.log(`User ${userId} joined their room`);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
}; 