// src/routes/chatRoutes.ts
import { Router } from 'express';
import { saveChat, getChats, markMessagesAsRead } from '../controllers/chatController';

const router = Router();

// Route to save a chat message
router.post('/', saveChat);

// Route to get chat messages between two users
router.get('/:user1/:user2', getChats);

// Route to mark messages as read
router.put('/read/:user1/:user2', markMessagesAsRead);

export default router;
