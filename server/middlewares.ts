import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';
import { storage } from './storage';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

// JWT authentication middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin access middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

// Check if user can access tournament
export const canAccessTournament = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const tournamentId = parseInt(req.params.id);
  
  if (isNaN(tournamentId)) {
    return res.status(400).json({ message: 'Invalid tournament ID' });
  }
  
  // Check if tournament exists
  const tournament = await storage.getTournament(tournamentId);
  
  if (!tournament) {
    return res.status(404).json({ message: 'Tournament not found' });
  }
  
  // If admin, allow access
  if (req.user.isAdmin) {
    req.tournament = tournament;
    return next();
  }
  
  // Check if user is a participant
  const participant = await storage.getParticipantByUserAndTournament(req.user.userId, tournamentId);
  
  if (!participant || participant.paymentStatus !== 'completed') {
    return res.status(403).json({ message: 'You must join this tournament first' });
  }
  
  // Check if tournament is active
  const now = new Date();
  if (tournament.startTime > now) {
    return res.status(403).json({ message: 'Tournament has not started yet' });
  }
  
  if (tournament.endTime < now && !tournament.resultPublished) {
    return res.status(403).json({ message: 'Tournament has ended, results will be published soon' });
  }
  
  req.tournament = tournament;
  req.participant = participant;
  next();
};

// Define the types for request augmentation
declare global {
  namespace Express {
    interface Request {
      tournament?: any;
      participant?: any;
    }
  }
}
