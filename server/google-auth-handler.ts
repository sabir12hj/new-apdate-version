import { Request, Response } from 'express';
import { storage } from './storage';
import { generateToken } from './auth';
import { User, InsertUser } from '@shared/schema';
import axios from 'axios';
import bcrypt from 'bcryptjs';

// Verify the Google token with Google's API
async function verifyGoogleToken(token: string): Promise<any> {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
    );
    return response.data;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid Google token');
  }
}

// Handler for Google token authentication
export async function handleGoogleAuth(req: Request, res: Response) {
  try {
    const { token, email, displayName, photoURL, uid } = req.body;

    if (!token || !email) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Verify the token with Google
    const googleUserInfo = await verifyGoogleToken(token);
    if (googleUserInfo.email !== email) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if user already exists with this Google ID
    let user = await storage.getUserByGoogleId(uid);
    
    // If not, check if user exists with this email
    if (!user) {
      user = await storage.getUserByEmail(email);
    }

    if (user) {
      // If user exists but doesn't have Google ID, update it
      if (!user.googleId) {
        user = await storage.updateUserProfile(user.id, {
          googleId: uid,
          fullName: displayName || user.fullName,
          profilePhoto: photoURL || user.profilePhoto
        });
      }
    } else {
      // Create a new user
      const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const newUser: InsertUser = {
        username,
        email,
        password: hashedPassword,
        googleId: uid,
        fullName: displayName || null,
        profilePhoto: photoURL || null,
        isAdmin: false,
        wallet: '0',
        mobileNumber: null,
        accountNumber: null,
        accountIfsc: null,
        upiId: null,
        telegramId: null
      };

      user = await storage.createUser(newUser);
    }

    // Generate JWT token
    const authToken = generateToken(user);

    // Return user data and token
    const { password, ...userData } = user;

    return res.status(200).json({
      user: userData,
      token: authToken
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ message: 'Server error during Google authentication' });
  }
}