// src/routes/groupRoutes.ts
import { Router } from 'express';
import { createGroup, getGroupById, getGroupMessages, sendGroupMessage } from '../controllers/groupController';

const router = Router();

// Route to create a new group
router.post('/create-group', createGroup);

// Route to get a group by its ID
router.get('/group/:groupId', getGroupById);

// Route to get group messages by group ID
router.get('/:groupId/messages', getGroupMessages);

// Route to send a group message
router.post('/:groupId/messages', sendGroupMessage);

export default router;
