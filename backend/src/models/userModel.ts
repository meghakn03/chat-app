import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    avatar?: string;
    online?: boolean;
    lastSeen?: Date;
    friends: mongoose.Schema.Types.ObjectId[]; // Array of ObjectId references to other users
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: 'https://placeimg.com/167/490/any' },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }]  // Reference to User model
});


export default mongoose.model<IUser>('User', UserSchema);
