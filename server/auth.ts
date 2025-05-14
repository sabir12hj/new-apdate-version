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
import { JWTPayload } from './types';

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

// Initialize passport serialization
passport.serializeUser<number>((user: any, done) => {
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
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin || false,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
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
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        message: 'Incorrect email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Incorrect email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = generateToken(user);
    
    // Remove sensitive data before sending response
    const { password: _, ...userData } = user;
    // Ensure isAdmin is boolean
    userData.isAdmin = !!userData.isAdmin;

    return res.json({
      message: 'Login successful',
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Server error during login',
      code: 'LOGIN_ERROR'
    });
  }
};

// Register middleware
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate user data
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      return res.status(400).json({ 
        message: 'Email already in use',
        code: 'EMAIL_EXISTS'
      });
    }
    
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      return res.status(400).json({ 
        message: 'Username already in use',
        code: 'USERNAME_EXISTS'
      });
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
    
    // Remove sensitive data before sending response
    const { password: __, ...cleanUserData } = user;
    cleanUserData.isAdmin = !!cleanUserData.isAdmin;
    return res.status(201).json({
      message: 'Registration successful',
      user: cleanUserData,
      token,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        message: validationError.message,
        code: 'VALIDATION_ERROR'
      });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'Server error during registration',
      code: 'REGISTRATION_ERROR'
    });
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
