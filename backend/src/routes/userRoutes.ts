import { Router } from 'express';
import { getUserFriends, getAllUsers, searchUsers } from '../controllers/userController';

const router = Router();

router.get('/:userId/friends', getUserFriends);
router.get('/all', getAllUsers);
router.get('/search', searchUsers);

export default router;
