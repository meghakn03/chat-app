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
