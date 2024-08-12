import { Router } from 'express';
import { getUserFriends, getAllUsers, searchUsers, addFriend, getUsersByIds, getUserGroups } from '../controllers/userController';

const router = Router();

router.get('/:userId/friends', getUserFriends);
router.get('/all', getAllUsers);
router.get('/search', searchUsers);
router.post('/add-friend', addFriend); // New route to add a friend
router.post('/by-ids', getUsersByIds); // New route to fetch users by IDs
router.get('/:userId/groups', getUserGroups);


export default router;
