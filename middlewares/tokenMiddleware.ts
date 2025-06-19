import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';
import { Role } from '../types/userTypes';

dotenv.config();

// Define the shape of JWT payload
interface JwtPayloadCustom {
    userId: string;
    email: string;
    password: string;
    role: Role; // hashed password
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



export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: `Access denied: ${role} role required` });
      return;
    }
    next();
  };
}
//when using on the Routes requireRole(Role.admin)

// Middleware to allow one of multiple roles
export function requireAnyRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: `Access denied: One of [${roles.join(', ')}] required` });
      return;
    }
    next();
  };
}



export async function requireUsdtNotApproved(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return void res.status(401).json({ error: "Unauthorized: User ID missing from token" });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return void res.status(404).json({ error: "User not found" });
    }

    if (user.usdt_Approved) {
      return void res.status(403).json({ error: "USDT already approved" });
    }

    // Continue to next handler
    next();
  } catch (err: any) {
    console.error("Error in requireUsdtNotApproved middleware:", err);
    return void res.status(500).json({ error: "Internal server error" });
  }
}
//when using on the Routes requireAnyRole(Role.admin, Role.user)


