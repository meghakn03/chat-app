// src/models/chatModel.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IChat extends Document {
  text: string;
  senderId: mongoose.Schema.Types.ObjectId;
  recipientId: mongoose.Schema.Types.ObjectId;
  timestamp: Date;
}

const ChatSchema: Schema = new Schema({
  text: { type: String, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IChat>('Chat', ChatSchema);
