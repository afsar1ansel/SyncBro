import prisma from '../config/prisma.js';

/**
 * @desc    Get server health status
 * @route   GET /api/health/server
 * @access  Public
 */
export const getServerHealth = (req, res) => {
  const healthData = {
    status: 'UP',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  };

  res.status(200).json({
    success: true,
    data: healthData,
  });
};

/**
 * @desc    Get database health status
 * @route   GET /api/health/db
 * @access  Public
 */
export const getDbHealth = async (req, res) => {
  try {
    // Check database connection by performing a simple query
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        message: 'Database connection is healthy',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'DOWN',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};
