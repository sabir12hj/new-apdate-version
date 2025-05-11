import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, InsertUser, insertUserSchema } from '@shared/schema';
import { log } from './vite';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// JWT secret (in production, this should be an environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'quiz-tournament-secret';
const JWT_EXPIRY = '7d';

// Setup passport local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// User serialization and deserialization
passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Generate JWT token for a user
export const generateToken = (user: User): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Register a new user
export const registerUser = async (userData: InsertUser): Promise<{ user: User; token: string }> => {
  try {
    // Validate user data
    insertUserSchema.parse(userData);
    
    // Check if user already exists
    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already in use');
    }
    
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already in use');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });
    
    // Generate token
    const token = generateToken(user);
    
    return { user, token };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      throw new Error(validationError.message);
    }
    throw error;
  }
};

// Login middleware
export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, (err: Error, user: User, info: { message: string }) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    
    const token = generateToken(user);
    
    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        wallet: user.wallet
      },
      token,
    });
  })(req, res, next);
};

// Register middleware
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await registerUser(req.body);
    
    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        wallet: user.wallet
      },
      token,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// Google OAuth mock (since we can't implement the real flow in this environment)
export const googleAuthMock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { googleId, email, username } = req.body;
    
    if (!googleId || !email || !username) {
      return res.status(400).json({ message: 'Missing required Google auth fields' });
    }
    
    // Check if user already exists with this Google ID
    let user = await storage.getUserByGoogleId(googleId);
    
    // If not, check if the email is already in use
    if (!user) {
      const existingEmail = await storage.getUserByEmail(email);
      
      if (existingEmail) {
        // Link Google ID to existing account
        user = existingEmail;
        // In a real implementation, we would update the user with the Google ID
      } else {
        // Create a new user
        const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        user = await storage.createUser({
          username,
          email,
          password: hashedPassword,
          googleId
        });
      }
    }
    
    const token = generateToken(user);
    
    return res.json({
      message: 'Google authentication successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        wallet: user.wallet
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};
