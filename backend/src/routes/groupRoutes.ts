// groupRoutes.ts
import { Router } from 'express';
import { createGroup, getGroupById } from '../controllers/groupController';

const router = Router();

// Route to create a new group
router.post('/create-group', createGroup);

// Route to get a group by its ID
router.get('/group/:groupId', getGroupById);

export default router;
