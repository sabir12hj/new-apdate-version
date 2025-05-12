import { Request } from 'express';
import { User } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        email: string;
        isAdmin: boolean;
    };
    tournament?: any;
    participant?: any;
}

export interface JWTPayload {
    userId: number;
    email: string;
    isAdmin: boolean;
}
