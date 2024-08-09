import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    avatar?: string;
    online?: boolean;
    lastSeen?: Date;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: 'https://placeimg.com/167/490/any' },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
