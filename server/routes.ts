import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { login, register, googleAuthMock, generateToken } from "./auth";
import { authenticateJWT, requireAdmin, canAccessTournament, type AuthenticatedRequest } from "./middlewares";
import { insertTournamentSchema, insertQuizSchema, insertQuestionSchema, updateProfileSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";
import { handleGoogleAuth } from "./google-auth-handler";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Auth routes
  apiRouter.post("/auth/login", login);
  apiRouter.post("/auth/register", register);
  apiRouter.post("/auth/google", googleAuthMock);
  apiRouter.post("/auth/google-token", handleGoogleAuth);

  // TEMPORARY: Create admin user endpoint
  apiRouter.post("/auth/temp-create-admin", async (req: Request, res: Response) => {
    try {
      const username = "admin";
      const email = "admin@example.com";
      const password = "admin123";
      // Check if user already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Admin user already exists" });
      }
      // Hash password
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const adminHashedPassword = await bcrypt.hash(password, salt);
      // Create admin user
      const userData = {
        username,
        email,
        password: adminHashedPassword,
        isAdmin: true,
      };
      const adminUser = await storage.createUser(userData, true);
      res.status(201).json({
        message: "Admin user created",
        user: { username, email, password: "admin123" },
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: "Failed to create admin user", error: errMsg });
    }
  });

  // TEMPORARY: Force admin privilege for admin@example.com
  apiRouter.post("/auth/force-admin", async (req: Request, res: Response) => {
    try {
      const email = "admin@example.com";
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      if (user.isAdmin) {
        return res.json({ message: "User is already admin" });
      }
      await storage.updateUserProfile(user.id, { isAdmin: true });
      res.json({ message: "Admin privileges granted to admin@example.com" });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: "Failed to update admin user", error: errMsg });
    }
  });

  // Public routes that don't require authentication
  apiRouter.get("/winners/recent", async (_req: Request, res: Response) => {
    try {
      const recentWinners = await storage.getRecentWinners();
      
      // Add user info and tournament info to winners (exclude sensitive data)
      const winnersWithInfo = await Promise.all(
        recentWinners.map(async (winner, index) => {
          const user = await storage.getUser(winner.userId);
          const tournament = await storage.getTournament(winner.tournamentId);
          return {
            ...winner,
            rank: index + 1,
            username: user?.username,
            tournamentName: tournament?.name
          };
        })
      );
      
      res.json(winnersWithInfo);
    } catch (error) {
      console.error("Error in /api/winners/recent:", error);
      res.status(500).json({ 
        message: "Failed to fetch recent winners",
        code: "FETCH_ERROR"
      });
    }
  });

  // Get live tournaments
  apiRouter.get("/tournaments/live", async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const tournaments = await storage.getAllTournaments();
      
      const liveTournaments = tournaments.filter(t => {
        const startTime = new Date(t.startTime);
        const endTime = new Date(t.endTime);
        return startTime <= now && endTime >= now;
      });

      // Add participant count and sanitize data
      const tournamentsWithCounts = await Promise.all(
        liveTournaments.map(async (tournament) => {
          const participants = await storage.getParticipantsByTournament(tournament.id);
          // Only include necessary public information
          return {
            id: tournament.id,
            name: tournament.name,
            startTime: tournament.startTime,
            endTime: tournament.endTime,
            entryFee: tournament.entryFee,
            prizePool: tournament.prizePool,
            description: tournament.description,
            participantCount: participants.length,
            totalSlots: tournament.totalSlots,
            resultPublished: tournament.resultPublished
          };
        })
      );
      
      res.json(tournamentsWithCounts);
    } catch (error) {
      console.error("Error in /tournaments/live:", error);
      res.status(500).json({ 
        message: "Failed to fetch live tournaments",
        code: "FETCH_ERROR"
      });
    }
  });

  // Get upcoming tournaments
  apiRouter.get("/tournaments/upcoming", async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const tournaments = await storage.getAllTournaments();
      
      const upcomingTournaments = tournaments.filter(t => {
        const startTime = new Date(t.startTime);
        return startTime > now;
      });

      // Add participant count and sanitize data
      const tournamentsWithCounts = await Promise.all(
        upcomingTournaments.map(async (tournament) => {
          const participants = await storage.getParticipantsByTournament(tournament.id);
          // Only include necessary public information
          return {
            id: tournament.id,
            name: tournament.name,
            startTime: tournament.startTime,
            endTime: tournament.endTime,
            entryFee: tournament.entryFee,
            prizePool: tournament.prizePool,
            description: tournament.description,
            participantCount: participants.length,
            totalSlots: tournament.totalSlots
          };
        })
      );
      
      res.json(tournamentsWithCounts);
    } catch (error) {
      console.error("Error in /tournaments/upcoming:", error);
      res.status(500).json({ 
        message: "Failed to fetch upcoming tournaments",
        code: "FETCH_ERROR"
      });
    }
  });

  // For testing only: Endpoint to create an admin user
  apiRouter.post("/auth/create-admin", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if user already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const adminHashedPassword = await bcrypt.hash(password, salt);
      
      // Create user with normal insertUserSchema fields
      const userData = {
        username,
        email,
        password: adminHashedPassword,
        googleId: null as string | null, // Explicitly set as null
        fullName: null as string | null,
        mobileNumber: null as string | null,
        accountNumber: null as string | null,
        accountIfsc: null as string | null,
        upiId: null as string | null,
        profilePhoto: null as string | null,
        telegramId: null as string | null
      };
      
      // Create admin user with isAdmin=true directly
      const adminUser = await storage.createUser(userData, true);
      
      // Generate token
      const token = generateToken(adminUser);
      
      // Return user (excluding password) and token
      const { password: _, ...userDataWithoutPassword } = adminUser;
      userDataWithoutPassword.isAdmin = !!userDataWithoutPassword.isAdmin;
      res.status(201).json({
        user: userDataWithoutPassword,
        token
      });
    } catch (error: any) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      console.error('Admin creation error:', errMsg);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });
  
  // Verify token and get current user
  apiRouter.get("/auth/user", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user data excluding the password
      const { password, ...userData } = user;
      userData.isAdmin = !!userData.isAdmin;
      
      return res.json({
        user: userData
      });
    } catch (error: any) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Tournament routes
  // Get all tournaments
  apiRouter.get("/tournaments", async (req: Request, res: Response) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      console.error("Error in /api/tournaments:", errMsg);
      res.status(500).json({ message: "Server error", error: errMsg });
    }
  });

  // Get single tournament
  apiRouter.get("/tournaments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      const tournament = await storage.getTournament(id);
      
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      res.json(tournament);
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Create tournament
  apiRouter.post("/tournaments", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(validatedData);
      res.status(201).json(tournament);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Update tournament
  apiRouter.put("/tournaments/:id", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      // Partial validation for update
      const validatedData = insertTournamentSchema.partial().parse(req.body);
      
      const tournament = await storage.updateTournament(id, validatedData);
      
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      res.json(tournament);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Delete tournament
  apiRouter.delete("/tournaments/:id", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      const success = await storage.deleteTournament(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      res.json({ message: 'Tournament deleted successfully' });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  apiRouter.post("/tournaments/:id/publish-results", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      const tournament = await storage.publishResults(id);
      
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      res.json({ message: 'Results published successfully', tournament });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Quiz routes
  // Get quiz for a tournament
  apiRouter.get("/tournaments/:id/quiz", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      const quiz = await storage.getQuizByTournament(tournamentId);
      
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found for this tournament' });
      }
      
      res.json(quiz);
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Create quiz for a tournament
  apiRouter.post("/quizzes", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = insertQuizSchema.parse(req.body);
      
      // Check if tournament exists
      const tournament = await storage.getTournament(validatedData.tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Check if a quiz already exists for this tournament
      const existingQuiz = await storage.getQuizByTournament(validatedData.tournamentId);
      if (existingQuiz) {
        return res.status(400).json({ message: 'A quiz already exists for this tournament' });
      }
      
      const quiz = await storage.createQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Update quiz
  apiRouter.put("/quizzes/:id", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }
      
      // Partial validation for update
      const validatedData = insertQuizSchema.partial().parse(req.body);
      
      const quiz = await storage.updateQuiz(id, validatedData);
      
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      
      res.json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Delete quiz
  apiRouter.delete("/quizzes/:id", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }
      
      const success = await storage.deleteQuiz(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      
      res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Question routes
  // Get questions for a quiz
  apiRouter.get("/quizzes/:id/questions", async (req: Request, res: Response) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }
      
      const questions = await storage.getQuestionsByQuiz(quizId);
      
      // For security, remove correct answers when returning to frontend
      const sanitizedQuestions = questions.map(q => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
      
      res.json(sanitizedQuestions);
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Get questions for a quiz (admin view with answers)
  apiRouter.get("/admin/quizzes/:id/questions", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }
      
      const questions = await storage.getQuestionsByQuiz(quizId);
      res.json(questions);
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Create question
  apiRouter.post("/questions", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      
      // Check if quiz exists
      const quiz = await storage.getQuiz(validatedData.quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Update question
  apiRouter.put("/questions/:id", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      // Partial validation for update
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      
      const question = await storage.updateQuestion(id, validatedData);
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin: Delete question
  apiRouter.delete("/questions/:id", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      const success = await storage.deleteQuestion(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Participant routes
  // Join tournament (payment)
  apiRouter.post("/tournaments/:id/join", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      const userId = req.user!.userId;
      
      // Check if tournament exists
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Check if user already joined
      const existingParticipant = await storage.getParticipantByUserAndTournament(userId, tournamentId);
      if (existingParticipant && existingParticipant.paymentStatus === 'completed') {
        return res.status(400).json({ message: 'You have already joined this tournament' });
      }
      
      // Check if tournament is full
      const participants = await storage.getParticipantsByTournament(tournamentId);
      if (participants.length >= tournament.totalSlots) {
        return res.status(400).json({ message: 'Tournament is full' });
      }
      
      // Check if tournament has started
      const now = new Date();
      if (tournament.startTime < now) {
        return res.status(400).json({ message: 'Tournament has already started' });
      }
      
      // Process payment (mock)
      const { method } = req.body;
      if (!method || !['wallet', 'paytm', 'upi'].includes(method)) {
        return res.status(400).json({ message: 'Invalid payment method' });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      let paymentStatus = 'pending';
      
      // If wallet payment, check balance
      if (method === 'wallet') {
        const entryFee = parseFloat(tournament.entryFee);
        const walletBalance = parseFloat(user.wallet);
        
        if (walletBalance < entryFee) {
          return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
        
        // Deduct from wallet
        await storage.updateUserWallet(userId, -entryFee);
        paymentStatus = 'success';
      } else {
        // For Paytm and UPI, we'll just simulate a successful payment
        paymentStatus = 'success';
      }
      
      // Create payment record
      const payment = await storage.createPayment({
        userId,
        tournamentId,
        amount: tournament.entryFee,
        status: paymentStatus,
        method,
        transactionId: `tx-${Date.now()}`
      });
      
      // Add participant if payment successful
      if (paymentStatus === 'success') {
        await storage.addParticipant({
          userId,
          tournamentId,
          paymentStatus: 'completed'
        });
      }
      
      res.json({ message: 'Tournament joined successfully', payment });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Get tournament participants
  apiRouter.get("/tournaments/:id/participants", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      // Check if tournament exists
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      const participants = await storage.getParticipantsByTournament(tournamentId);
      
      // Add user info to participants
      const participantsWithUserInfo = await Promise.all(
        participants.map(async (participant) => {
          const user = await storage.getUser(participant.userId);
          return {
            ...participant,
            username: user?.username,
            email: user?.email
          };
        })
      );
      
      res.json(participantsWithUserInfo);
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Quiz attempt routes
  // Start quiz
  apiRouter.post("/tournaments/:id/start-quiz", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      const userId = req.user!.userId;
      
      // Check if tournament exists and is live
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      const now = new Date();
      if (tournament.startTime > now) {
        return res.status(400).json({ message: 'Tournament has not started yet' });
      }
      
      if (tournament.endTime < now) {
        return res.status(400).json({ message: 'Tournament has already ended' });
      }
      
      // Check if user is a participant
      const participant = await storage.getParticipantByUserAndTournament(userId, tournamentId);
      if (!participant || participant.paymentStatus !== 'completed') {
        return res.status(403).json({ message: 'You must join this tournament first' });
      }
      
      // Check if user already attempted the quiz
      if (participant.hasAttempted) {
        return res.status(400).json({ message: 'You have already attempted this quiz' });
      }
      
      // Get quiz and questions
      const quiz = await storage.getQuizByTournament(tournamentId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found for this tournament' });
      }
      
      const questions = await storage.getQuestionsByQuiz(quiz.id);
      if (questions.length === 0) {
        return res.status(404).json({ message: 'No questions found for this quiz' });
      }
      
      // For security, remove correct answers when returning to frontend
      const sanitizedQuestions = questions.map(q => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
      
      res.json({
        quiz,
        questions: sanitizedQuestions,
        totalQuestions: questions.length
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Submit answer
  apiRouter.post("/tournaments/:id/submit-answer", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      const userId = req.user!.userId;
      const { questionId, answerIndex, timeTaken } = req.body;
      
      if (typeof questionId !== 'number' || typeof answerIndex !== 'number' || typeof timeTaken !== 'number') {
        return res.status(400).json({ message: 'Invalid request body' });
      }
      
      // Check if tournament exists and is live
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      const now = new Date();
      if (tournament.startTime > now || tournament.endTime < now) {
        return res.status(400).json({ message: 'Tournament is not active' });
      }
      
      // Check if user is a participant
      const participant = await storage.getParticipantByUserAndTournament(userId, tournamentId);
      if (!participant || participant.paymentStatus !== 'completed') {
        return res.status(403).json({ message: 'You must join this tournament first' });
      }
      
      // Get the question
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Check if answer is correct
      const isCorrect = question.correctAnswer === answerIndex;
      
      // Save response
      await storage.saveUserResponse({
        userId,
        questionId,
        tournamentId,
        answerIndex,
        isCorrect,
        timeTaken
      });
      
      res.json({
        isCorrect,
        correctAnswer: question.correctAnswer
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Finish quiz
  apiRouter.post("/tournaments/:id/finish-quiz", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      const userId = req.user!.userId;
      
      // Check if tournament exists
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Check if user is a participant
      const participant = await storage.getParticipantByUserAndTournament(userId, tournamentId);
      if (!participant || participant.paymentStatus !== 'completed') {
        return res.status(403).json({ message: 'You must join this tournament first' });
      }
      
      // Get user responses
      const responses = await storage.getUserResponsesByUserAndTournament(userId, tournamentId);
      
      // Calculate score and total time
      const correctAnswers = responses.filter(r => r.isCorrect).length;
      const totalTimeTaken = responses.reduce((total, r) => total + r.timeTaken, 0);
      
      // Update participant score
      await storage.updateParticipantScore(userId, tournamentId, correctAnswers, totalTimeTaken);
      
      res.json({
        message: 'Quiz finished successfully',
        score: correctAnswers,
        totalQuestions: responses.length,
        timeTaken: totalTimeTaken
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Leaderboard routes
  // Get tournament leaderboard
  apiRouter.get("/tournaments/:id/leaderboard", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: 'Invalid tournament ID' });
      }
      
      // Check if tournament exists
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Check if results are published
      if (!tournament.resultPublished && !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Results have not been published yet' });
      }
      
      const leaderboard = await storage.getTournamentLeaderboard(tournamentId);
      
      // Add user info to leaderboard
      const leaderboardWithUserInfo = await Promise.all(
        leaderboard.map(async (entry, index) => {
          const user = await storage.getUser(entry.userId);
          return {
            ...entry,
            rank: index + 1,
            username: user?.username
          };
        })
      );
      
      res.json(leaderboardWithUserInfo);
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Wallet operations
  // Get user wallet
  apiRouter.get("/wallet", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        wallet: user.wallet
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Add money to wallet (mock)
  apiRouter.post("/wallet/add", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { amount } = req.body;
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      const user = await storage.updateUserWallet(userId, amount);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        message: `₹${amount} added to wallet successfully`,
        wallet: user.wallet
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Get user profile
  apiRouter.get("/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove sensitive information
      const { password, ...userProfile } = user;
      
      res.json(userProfile);
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Update user profile
  apiRouter.put("/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      
      // Validate the request body using the zod schema
      const result = updateProfileSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Extract validated profile data
      const profileData = result.data;
      
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove sensitive information
      const { password, ...userProfile } = updatedUser;
      
      res.json({
        message: 'Profile updated successfully',
        profile: userProfile
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Upload profile picture (base64)
  apiRouter.post("/profile/photo", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { photo } = req.body;
      
      if (!photo || typeof photo !== 'string') {
        return res.status(400).json({ message: 'Invalid photo data' });
      }
      
      // Validate if it's a valid base64 image
      if (!photo.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid image format' });
      }
      
      // Save the base64 string directly to the user profile
      const updatedUser = await storage.updateUserProfile(userId, { profilePhoto: photo });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        message: 'Profile photo updated successfully'
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  // Admin dashboard stats
  apiRouter.get("/admin/stats", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tournaments = await storage.getAllTournaments();
      const liveTournaments = await storage.getLiveTournaments();
      
      const allParticipants = Array.from(new Set(
        (await Promise.all(tournaments.map(t => storage.getParticipantsByTournament(t.id))))
          .flat()
          .map(p => p.userId)
      ));
      
      const totalRevenue = (await Promise.all(tournaments.map(t => storage.getPaymentsByTournament(t.id))))
        .flat()
        .filter(p => p.status === 'success')
        .reduce((total, p) => total + parseFloat(p.amount), 0);
      
      res.json({
        totalTournaments: tournaments.length,
        liveTournaments: liveTournaments.length,
        totalParticipants: allParticipants.length,
        totalRevenue
      });
    } catch (error) {
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: 'Server error', error: errMsg });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
