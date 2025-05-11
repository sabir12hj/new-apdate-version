import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { generateToken } from './auth';
import { User, InsertUser } from '@shared/schema';

export const setupGoogleAuth = (app: Express.Application) => {
  // Configure Google Strategy for Passport
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        passReqToCallback: true,
      },
      async (
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
        try {
          // Check if user already exists with this Google ID
          let user = await storage.getUserByGoogleId(profile.id);
          
          // If user doesn't exist, create a new one
          if (!user) {
            // Extract email from profile
            const email = profile.emails && profile.emails.length > 0 
              ? profile.emails[0].value 
              : `${profile.id}@google.user`;
            
            // Check if user exists with this email
            user = await storage.getUserByEmail(email);
            
            if (user) {
              // Update existing user with Google ID
              user = await storage.updateUserProfile(user.id, {
                google_id: profile.id,
              });
            } else {
              // Create a new user
              const newUser: InsertUser = {
                username: `${profile.displayName.replace(/\s+/g, '_').toLowerCase()}_${profile.id.slice(-5)}`,
                email,
                password: Math.random().toString(36).slice(-16), // Random password
                google_id: profile.id,
                full_name: profile.displayName,
                profile_photo: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
                is_admin: false,
                wallet: '0'
              };
              
              user = await storage.createUser(newUser);
            }
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google auth routes
  app.get(
    '/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth' }),
    (req: Request, res: Response) => {
      // Generate JWT token
      const token = generateToken(req.user as User);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || ''}/auth/callback?token=${token}`);
    }
  );
};
