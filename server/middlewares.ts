import { Response, NextFunction } from 'express';
import { verifyToken } from './auth';
import { storage } from './storage';
import { AuthenticatedRequest } from './types';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/tournaments',
  '/api/winners/recent',
  '/api/tournaments/live',
  '/api/tournaments/upcoming'
];

// JWT authentication middleware
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check if route is public
  if (PUBLIC_ROUTES.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      message: 'Authorization header missing',
      code: 'AUTH_HEADER_MISSING'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Token missing',
      code: 'TOKEN_MISSING'
    });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Admin access middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      message: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

// Check if user can access tournament
export const canAccessTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  const tournamentId = parseInt(req.params.id);
  
  if (isNaN(tournamentId)) {
    return res.status(400).json({ 
      message: 'Invalid tournament ID',
      code: 'INVALID_TOURNAMENT_ID'
    });
  }
  
  // Check if tournament exists
  const tournament = await storage.getTournament(tournamentId);
  
  if (!tournament) {
    return res.status(404).json({ 
      message: 'Tournament not found',
      code: 'TOURNAMENT_NOT_FOUND'
    });
  }
  
  // If admin, allow access
  if (req.user.isAdmin) {
    req.tournament = tournament;
    return next();
  }
  
  // Check if user is a participant
  const participant = await storage.getParticipantByUserAndTournament(req.user.userId, tournamentId);
  
  if (!participant || participant.paymentStatus !== 'completed') {
    return res.status(403).json({ 
      message: 'You must join this tournament first',
      code: 'NOT_PARTICIPANT'
    });
  }
  
  // Check if tournament is active
  const now = new Date();
  if (tournament.startTime > now) {
    return res.status(403).json({ 
      message: 'Tournament has not started yet',
      code: 'TOURNAMENT_NOT_STARTED'
    });
  }
  
  if (tournament.endTime < now && !tournament.resultPublished) {
    return res.status(403).json({ 
      message: 'Tournament has ended, results will be published soon',
      code: 'TOURNAMENT_ENDED'
    });
  }
  
  req.tournament = tournament;
  req.participant = participant;
  next();
};

export type { AuthenticatedRequest } from './types';
