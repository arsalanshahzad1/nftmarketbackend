import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';

dotenv.config();

// Define the shape of your JWT payload
interface JwtPayloadCustom {
    userId: string;
    email: string;
    password: string; // hashed password
    tokenVersion: number;
}

// Extend Express Request to include `user`
declare module 'express-serve-static-core' {
    interface Request {
        user?: JwtPayloadCustom;
    }
}

// Middleware function to check and decode JWT
export async function checkToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Unauthorized: Token missing' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayloadCustom;
        const dbUser = await UserModel.findById(decoded.userId);

        if (!dbUser || dbUser.tokenVersion !== decoded.tokenVersion) {
            res.status(403).json({ error: 'Token no longer valid' });
            return;
        }

        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
}

