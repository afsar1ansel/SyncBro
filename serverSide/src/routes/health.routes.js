import express from 'express';
import { getServerHealth, getDbHealth } from '../controllers/health.controller.js';

const router = express.Router();

// Get server health
router.get('/', getServerHealth);
router.get('/server', getServerHealth);

// Get database health
router.get('/db', getDbHealth);

export default router;

