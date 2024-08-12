// src/models/chatModel.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IChat extends Document {
  text: string;
  senderId: mongoose.Schema.Types.ObjectId;
  recipientId?: mongoose.Schema.Types.ObjectId;
  groupId?: mongoose.Schema.Types.ObjectId; // Add groupId for group chats
  timestamp: Date;
}

const ChatSchema: Schema = new Schema({
  text: { type: String, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional for one-on-one chats
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' }, // Optional for group chats
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IChat>('Chat', ChatSchema);
