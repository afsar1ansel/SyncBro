import app from './app.js';
import { config } from './config/index.js';

const startServer = () => {
  try {
    app.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
      console.log(`🛠️  Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();
