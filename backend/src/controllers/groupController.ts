// groupController.ts
import { Request, Response } from 'express';
import Group from '../models/groupModel';
import User from '../models/userModel';

// Create a new group
export const createGroup = async (req: Request, res: Response) => {
    const { userId, groupName, memberIds } = req.body;

    try {
        // Create a new group with the logged-in user as the admin
        const newGroup = new Group({
            groupName,
            admin: userId,
            members: memberIds
        });

        await newGroup.save();

        // Update each member's groups field
        await User.updateMany(
            { _id: { $in: [...memberIds, userId] } },
            { $push: { groups: newGroup._id } }
        );

        res.status(201).json({ message: 'Group created successfully', group: newGroup });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get group by ID
export const getGroupById = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    try {
        const group = await Group.findById(groupId)
            .populate('admin', 'username email avatar')
            .populate('members', 'username email avatar');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.status(200).json(group);
    } catch (error) {
        console.error('Error fetching group by ID:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
