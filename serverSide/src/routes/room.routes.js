import express from 'express';
import * as roomController from '../controllers/room.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // All room routes require authentication

router.post('/', roomController.createRoom);
router.get('/', roomController.getMyRooms);
router.get('/:slug', roomController.getRoomBySlug);
router.get('/:roomId/messages', roomController.getRoomMessages);

export default router;
