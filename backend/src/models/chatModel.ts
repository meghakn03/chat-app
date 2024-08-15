// src/models/chatModel.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IChat extends Document {
  text: string;
  senderId: mongoose.Schema.Types.ObjectId;
  recipientId?: mongoose.Schema.Types.ObjectId;
  groupId?: mongoose.Schema.Types.ObjectId;
  fileUrl?: string; // Optional for file attachments
  timestamp: Date;
}

const ChatSchema: Schema = new Schema({
  text: { type: String, required: false },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
  fileUrl: { type: String }, // Optional field for file URLs
  timestamp: { type: Date, default: Date.now }
});



export default mongoose.model<IChat>('Chat', ChatSchema);
