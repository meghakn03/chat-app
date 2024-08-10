import { Request, Response } from 'express';
import User from '../models/userModel';

// Get all friends of a user
export const getUserFriends = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).populate('friends', 'username email avatar');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.friends);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('username email avatar');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Search for users by username or email
export const searchUsers = async (req: Request, res: Response) => {
    const { query } = req.query;

    try {
        const users = await User.find({
            $or: [
                { username: new RegExp(query as string, 'i') },
                { email: new RegExp(query as string, 'i') }
            ]
        }).select('username email avatar');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add a user to the logged-in user's friends list
export const addFriend = async (req: Request, res: Response) => {
    const { userId, friendId } = req.body;

    try {
        // Find the logged-in user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the friend is already in the friends list
        if (user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'User is already a friend' });
        }

        // Add the friendId to the friends array
        user.friends.push(friendId);
        await user.save();

        res.status(200).json({ message: 'Friend added successfully' });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get users by IDs
export const getUsersByIds = async (req: Request, res: Response) => {
    const { ids } = req.body;

    console.log('Fetching users with IDs:', ids); // Log the IDs being fetched

    try {
        const users = await User.find({ '_id': { $in: ids } }).select('username email avatar');
        console.log('Users fetched:', users); // Log the fetched users
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users by IDs:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};



