import { Request, Response } from 'express';
import User from '../models/userModel';
import bcrypt from 'bcryptjs'; // For password hashing
import jwt from 'jsonwebtoken'; // For creating JWT tokens

export const register = async (req: Request, res: Response) => {
    const { username, email, password, avatar, online, lastSeen } = req.body;

    console.log('Register Request:', req.body);  // Debug line

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            avatar: avatar || 'https://placeimg.com/167/490/any', // Default if not provided
            online: online !== undefined ? online : false, // Default to false if not provided
            lastSeen: lastSeen || new Date() // Default to current date if not provided
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration Error:', error);  // Debug line
        res.status(500).json({ message: 'Server error', error });
    }
};


export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    console.log('Login Request:', req.body);  // Debug line
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
    
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
    
        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );
    
        res.status(200).json({ token });
    } catch (error) {
        console.error('Login Error:', error);  // Debug line
        res.status(500).json({ message: 'Server error', error });
    }
};
