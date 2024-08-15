// src/controllers/chatController.ts
import { Request, Response } from 'express';
import Chat from '../models/chatModel';

// Save a new chat message
export const saveChat = async (req: Request, res: Response) => {
  const { text, senderId, recipientId, fileUrl } = req.body;

  try {
    // Create a new chat message with optional text
    const chatMessage = new Chat({
      text: text || '', // Provide an empty string if text is not provided
      senderId,
      recipientId,
      fileUrl
    });

    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// Get chat messages between two users
export const getChats = async (req: Request, res: Response) => {
  const { user1, user2 } = req.params;

  try {
    const chats = await Chat.find({
      $or: [
        { senderId: user1, recipientId: user2 },
        { senderId: user2, recipientId: user1 }
      ]
    }).sort({ timestamp: 1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// New function to mark messages as read
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
      const { user1, user2 } = req.params;

      // Find messages where user1 is the recipient and user2 is the sender, and mark them as read
      await Chat.updateMany(
          { senderId: user2, receiverId: user1, read: false },
          { $set: { read: true } }
      );

      res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
      res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};
