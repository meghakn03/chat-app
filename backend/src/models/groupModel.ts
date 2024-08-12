import mongoose, { Document, Schema } from 'mongoose';

interface IGroup extends Document {
    groupName: string;
    admin: mongoose.Schema.Types.ObjectId; // Reference to User model
    members: mongoose.Schema.Types.ObjectId[]; // Array of ObjectId references to users
    createdAt: Date;
}

const GroupSchema: Schema = new Schema({
    groupName: { type: String, required: true },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IGroup>('Group', GroupSchema);
