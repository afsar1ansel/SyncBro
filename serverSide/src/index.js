import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/index.js';
import { socketAuthMiddleware } from './middlewares/socket.middleware.js';
import { setupSocketHandlers } from './socket/socket.server.js';
import { setIO } from './socket/io.js';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
});

setIO(io);

// Attach socket authentication middleware
io.use(socketAuthMiddleware);

// Set up socket handlers
setupSocketHandlers(io);

const startServer = () => {
  try {
    httpServer.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
      console.log(`🛠️  Environment: ${config.nodeEnv}`);
      console.log(`🔌 WebSockets initialized`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();
