// src/routes/chatRoutes.ts
import { Router } from 'express';
import { saveChat, getChats } from '../controllers/chatController';

const router = Router();

// Route to save a chat message
router.post('/', saveChat);

// Route to get chat messages between two users
router.get('/:user1/:user2', getChats);

export default router;
