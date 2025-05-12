var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/storage.ts
import connectPg from "connect-pg-simple";
import session from "express-session";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertParticipantSchema: () => insertParticipantSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertQuestionSchema: () => insertQuestionSchema,
  insertQuizSchema: () => insertQuizSchema,
  insertTournamentSchema: () => insertTournamentSchema,
  insertUserResponseSchema: () => insertUserResponseSchema,
  insertUserSchema: () => insertUserSchema,
  participants: () => participants,
  payments: () => payments,
  questions: () => questions,
  quizzes: () => quizzes,
  tournaments: () => tournaments,
  updateProfileSchema: () => updateProfileSchema,
  userResponses: () => userResponses,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  googleId: text("google_id").unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  wallet: numeric("wallet", { precision: 10, scale: 2 }).default("0").notNull(),
  fullName: text("full_name"),
  mobileNumber: text("mobile_number"),
  accountNumber: text("account_number"),
  accountIfsc: text("account_ifsc"),
  upiId: text("upi_id"),
  profilePhoto: text("profile_photo"),
  telegramId: text("telegram_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  entryFee: numeric("entry_fee", { precision: 10, scale: 2 }).notNull(),
  prizePool: numeric("prize_pool", { precision: 10, scale: 2 }).notNull(),
  totalSlots: integer("total_slots").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  resultPublished: boolean("result_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(),
  // Array of options
  correctAnswer: integer("correct_answer").notNull(),
  // Index of correct option
  timer: integer("timer").notNull(),
  // Time in seconds
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  paymentStatus: text("payment_status").notNull().default("pending"),
  // pending, completed, failed
  score: integer("score").default(0),
  timeTaken: integer("time_taken").default(0),
  // In seconds
  prize: numeric("prize", { precision: 10, scale: 2 }).default("0").notNull(),
  hasAttempted: boolean("has_attempted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return {
    unq: uniqueIndex("participants_user_tournament_idx").on(table.userId, table.tournamentId)
  };
});
var userResponses = pgTable("user_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  answerIndex: integer("answer_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeTaken: integer("time_taken").notNull(),
  // Time taken to answer in seconds
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return {
    unq: uniqueIndex("user_response_idx").on(table.userId, table.questionId, table.tournamentId)
  };
});
var payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  // success, failed, pending
  method: text("method").notNull(),
  // wallet, paytm, upi
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isAdmin: true,
  wallet: true
});
var updateProfileSchema = z.object({
  fullName: z.string().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountIfsc: z.string().optional().nullable(),
  upiId: z.string().optional().nullable(),
  telegramId: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable()
});
var insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
  isPublished: true,
  resultPublished: true
});
var insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true
});
var insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true
});
var insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
  score: true,
  timeTaken: true,
  prize: true,
  hasAttempted: true
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true
});
var insertUserResponseSchema = createInsertSchema(userResponses).omit({
  id: true,
  createdAt: true
});

// server/db.ts
var WebSocketWithRetry = class _WebSocketWithRetry extends ws {
  maxRetries = 5;
  retryCount = 0;
  retryDelay = 1e3;
  wsUrl;
  wsOptions;
  constructor(url, options) {
    super(url, options);
    this.wsUrl = url;
    this.wsOptions = options;
    this.addEventListener("error", this.handleError.bind(this));
  }
  handleError(error) {
    console.error("WebSocket error:", error.message);
    if (this.retryCount < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(2, this.retryCount);
      console.log(`Retrying connection in ${delay}ms... (Attempt ${this.retryCount + 1}/${this.maxRetries})`);
      setTimeout(() => {
        this.retryCount++;
        new _WebSocketWithRetry(this.wsUrl, this.wsOptions);
      }, delay);
    } else {
      console.error("Max retries reached. Please check your database connection.");
    }
  }
};
neonConfig.webSocketConstructor = WebSocketWithRetry;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var connectionString = process.env.DATABASE_URL;
console.log("Connecting to database...");
var pool = new Pool({
  connectionString,
  ssl: true,
  max: 20,
  // maximum number of clients in the pool
  idleTimeoutMillis: 3e4,
  // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5e3,
  // how long to wait for a connection
  maxUses: 7500
  // close & replace a connection after it's been used this many times
});
var connectWithRetry = async (retries = 5) => {
  try {
    const client = await pool.connect();
    console.log("Database connected successfully");
    client.release();
  } catch (err) {
    if (retries > 0) {
      console.log(`Retrying database connection... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      return connectWithRetry(retries - 1);
    }
    console.error("Database connection error:", err);
    throw err;
  }
};
connectWithRetry().catch(console.error);
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, isNull, not } from "drizzle-orm";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async getUserByGoogleId(googleId) {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || void 0;
  }
  async createUser(insertUser, isAdmin = false) {
    const userData = {
      ...insertUser,
      isAdmin,
      // Explicitly use boolean value to make sure it's set correctly
      wallet: "0.00",
      fullName: insertUser.fullName || null,
      mobileNumber: insertUser.mobileNumber || null,
      accountNumber: insertUser.accountNumber || null,
      accountIfsc: insertUser.accountIfsc || null,
      upiId: insertUser.upiId || null,
      profilePhoto: insertUser.profilePhoto || null,
      telegramId: insertUser.telegramId || null,
      googleId: insertUser.googleId || null
    };
    const [user] = await db.insert(users).values(userData).returning();
    if (isAdmin && !user.isAdmin) {
      const [updatedUser] = await db.update(users).set({ isAdmin: true }).where(eq(users.id, user.id)).returning();
      return updatedUser;
    }
    return user;
  }
  async updateUserWallet(userId, amount) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const walletBalance = parseFloat(user.wallet) + amount;
    const [updatedUser] = await db.update(users).set({ wallet: walletBalance.toString() }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async updateUserProfile(userId, profileData) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const safeProfileData = { ...profileData };
    delete safeProfileData.id;
    delete safeProfileData.username;
    delete safeProfileData.email;
    delete safeProfileData.password;
    delete safeProfileData.isAdmin;
    delete safeProfileData.wallet;
    delete safeProfileData.createdAt;
    const [updatedUser] = await db.update(users).set(safeProfileData).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  // Tournament operations
  async createTournament(insertTournament) {
    const [tournament] = await db.insert(tournaments).values(insertTournament).returning();
    return tournament;
  }
  async getTournament(id) {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament || void 0;
  }
  async getAllTournaments() {
    return await db.select().from(tournaments).orderBy(desc(tournaments.startTime));
  }
  async getLiveTournaments() {
    const now = /* @__PURE__ */ new Date();
    return await db.select().from(tournaments).where(
      and(
        eq(tournaments.isPublished, true),
        not(eq(tournaments.resultPublished, true))
      )
    ).orderBy(tournaments.startTime);
  }
  async getUpcomingTournaments() {
    const now = /* @__PURE__ */ new Date();
    return await db.select().from(tournaments).where(
      and(
        eq(tournaments.isPublished, true),
        not(eq(tournaments.resultPublished, true))
      )
    ).orderBy(tournaments.startTime);
  }
  async updateTournament(id, tournament) {
    const [updatedTournament] = await db.update(tournaments).set(tournament).where(eq(tournaments.id, id)).returning();
    return updatedTournament || void 0;
  }
  async deleteTournament(id) {
    try {
      await db.delete(tournaments).where(eq(tournaments.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }
  async publishResults(id) {
    const [updatedTournament] = await db.update(tournaments).set({
      resultPublished: true
    }).where(eq(tournaments.id, id)).returning();
    return updatedTournament || void 0;
  }
  // Quiz operations
  async createQuiz(quiz) {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }
  async getQuiz(id) {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || void 0;
  }
  async getQuizByTournament(tournamentId) {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.tournamentId, tournamentId));
    return quiz || void 0;
  }
  async updateQuiz(id, quizUpdate) {
    const [updatedQuiz] = await db.update(quizzes).set(quizUpdate).where(eq(quizzes.id, id)).returning();
    return updatedQuiz || void 0;
  }
  async deleteQuiz(id) {
    try {
      await db.delete(quizzes).where(eq(quizzes.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }
  // Question operations
  async createQuestion(question) {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }
  async getQuestionsByQuiz(quizId) {
    return await db.select().from(questions).where(eq(questions.quizId, quizId));
  }
  async updateQuestion(id, questionUpdate) {
    const [updatedQuestion] = await db.update(questions).set(questionUpdate).where(eq(questions.id, id)).returning();
    return updatedQuestion || void 0;
  }
  async deleteQuestion(id) {
    try {
      await db.delete(questions).where(eq(questions.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }
  // Participant operations
  async addParticipant(participant) {
    const [newParticipant] = await db.insert(participants).values(participant).returning();
    return newParticipant;
  }
  async getParticipantsByTournament(tournamentId) {
    return await db.select().from(participants).where(eq(participants.tournamentId, tournamentId));
  }
  async getParticipantByUserAndTournament(userId, tournamentId) {
    const [participant] = await db.select().from(participants).where(
      and(
        eq(participants.userId, userId),
        eq(participants.tournamentId, tournamentId)
      )
    );
    return participant || void 0;
  }
  async updateParticipantScore(userId, tournamentId, score, timeTaken) {
    const [updatedParticipant] = await db.update(participants).set({
      score,
      timeTaken,
      hasAttempted: true
    }).where(
      and(
        eq(participants.userId, userId),
        eq(participants.tournamentId, tournamentId)
      )
    ).returning();
    return updatedParticipant || void 0;
  }
  async updateParticipantPrize(userId, tournamentId, prize) {
    const [updatedParticipant] = await db.update(participants).set({ prize: prize.toString() }).where(
      and(
        eq(participants.userId, userId),
        eq(participants.tournamentId, tournamentId)
      )
    ).returning();
    return updatedParticipant || void 0;
  }
  // Payment operations
  async createPayment(payment) {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }
  async getPaymentsByUser(userId) {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }
  async getPaymentsByTournament(tournamentId) {
    return await db.select().from(payments).where(eq(payments.tournamentId, tournamentId));
  }
  // User Response operations
  async saveUserResponse(response) {
    const [newResponse] = await db.insert(userResponses).values(response).returning();
    return newResponse;
  }
  async getUserResponsesByUserAndTournament(userId, tournamentId) {
    return await db.select().from(userResponses).where(
      and(
        eq(userResponses.userId, userId),
        eq(userResponses.tournamentId, tournamentId)
      )
    );
  }
  // Leaderboard
  async getTournamentLeaderboard(tournamentId) {
    const leaderboard = await db.select().from(participants).where(
      and(
        eq(participants.tournamentId, tournamentId),
        eq(participants.hasAttempted, true),
        not(isNull(participants.score))
      )
    ).orderBy(desc(participants.score));
    return leaderboard;
  }
  async getRecentWinners() {
    const winners = await db.select().from(participants).where(not(eq(participants.prize, "0"))).orderBy(desc(participants.createdAt)).limit(5);
    return winners;
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
var JWT_SECRET = process.env.JWT_SECRET || "quiz-tournament-secret";
var JWT_EXPIRY = "7d";
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "Incorrect email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
var generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin || false
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};
var verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
var login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or password",
        code: "INVALID_CREDENTIALS"
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        code: "INVALID_CREDENTIALS"
      });
    }
    const token = generateToken(user);
    const { password: _, ...userData } = user;
    return res.json({
      message: "Login successful",
      user: userData,
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error during login",
      code: "LOGIN_ERROR"
    });
  }
};
var register = async (req, res, next) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already in use",
        code: "EMAIL_EXISTS"
      });
    }
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      return res.status(400).json({
        message: "Username already in use",
        code: "USERNAME_EXISTS"
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });
    const token = generateToken(user);
    const { password: _, ...cleanUserData } = user;
    return res.status(201).json({
      message: "Registration successful",
      user: cleanUserData,
      token
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: validationError.message,
        code: "VALIDATION_ERROR"
      });
    }
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Server error during registration",
      code: "REGISTRATION_ERROR"
    });
  }
};
var googleAuthMock = async (req, res, next) => {
  try {
    const { googleId, email, username } = req.body;
    if (!googleId || !email || !username) {
      return res.status(400).json({ message: "Missing required Google auth fields" });
    }
    let user = await storage.getUserByGoogleId(googleId);
    if (!user) {
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        user = existingEmail;
      } else {
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
      message: "Google authentication successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        wallet: user.wallet
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// server/middlewares.ts
var PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/tournaments",
  "/api/winners/recent",
  "/api/tournaments/live",
  "/api/tournaments/upcoming"
];
var authenticateJWT = (req, res, next) => {
  if (PUBLIC_ROUTES.includes(req.path)) {
    return next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization header missing",
      code: "AUTH_HEADER_MISSING"
    });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Token missing",
      code: "TOKEN_MISSING"
    });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      message: "Invalid or expired token",
      code: "INVALID_TOKEN"
    });
  }
};
var requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({
      message: "Admin access required",
      code: "ADMIN_REQUIRED"
    });
  }
  next();
};

// server/routes.ts
import { z as z2 } from "zod";
import { fromZodError as fromZodError2 } from "zod-validation-error";
import bcrypt3 from "bcryptjs";

// server/google-auth-handler.ts
import axios from "axios";
import bcrypt2 from "bcryptjs";
async function verifyGoogleToken(token) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying Google token:", error);
    throw new Error("Invalid Google token");
  }
}
async function handleGoogleAuth(req, res) {
  try {
    const { token, email, displayName, photoURL, uid } = req.body;
    if (!token || !email) {
      return res.status(400).json({ message: "Missing required parameters" });
    }
    const googleUserInfo = await verifyGoogleToken(token);
    if (googleUserInfo.email !== email) {
      return res.status(401).json({ message: "Invalid token" });
    }
    let user = await storage.getUserByGoogleId(uid);
    if (!user) {
      user = await storage.getUserByEmail(email);
    }
    if (user) {
      if (!user.googleId) {
        user = await storage.updateUserProfile(user.id, {
          googleId: uid,
          fullName: displayName || user.fullName,
          profilePhoto: photoURL || user.profilePhoto
        });
      }
    } else {
      const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 1e3);
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt2.hash(randomPassword, 10);
      const newUser = {
        username,
        email,
        password: hashedPassword,
        googleId: uid,
        fullName: displayName || null,
        profilePhoto: photoURL || null,
        isAdmin: false,
        wallet: "0",
        mobileNumber: null,
        accountNumber: null,
        accountIfsc: null,
        upiId: null,
        telegramId: null
      };
      user = await storage.createUser(newUser);
    }
    const authToken = generateToken(user);
    const { password, ...userData } = user;
    return res.status(200).json({
      user: userData,
      token: authToken
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ message: "Server error during Google authentication" });
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  const apiRouter = express.Router();
  app2.use("/api", apiRouter);
  apiRouter.post("/auth/login", login);
  apiRouter.post("/auth/register", register);
  apiRouter.post("/auth/google", googleAuthMock);
  apiRouter.post("/auth/google-token", handleGoogleAuth);
  apiRouter.get("/winners/recent", async (_req, res) => {
    try {
      const recentWinners = await storage.getRecentWinners();
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
  apiRouter.get("/tournaments/live", async (_req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const tournaments2 = await storage.getAllTournaments();
      const liveTournaments = tournaments2.filter((t) => {
        const startTime = new Date(t.startTime);
        const endTime = new Date(t.endTime);
        return startTime <= now && endTime >= now;
      });
      const tournamentsWithCounts = await Promise.all(
        liveTournaments.map(async (tournament) => {
          const participants2 = await storage.getParticipantsByTournament(tournament.id);
          return {
            id: tournament.id,
            name: tournament.name,
            startTime: tournament.startTime,
            endTime: tournament.endTime,
            entryFee: tournament.entryFee,
            prizePool: tournament.prizePool,
            description: tournament.description,
            participantCount: participants2.length,
            totalSlots: tournament.totalSlots,
            rules: tournament.rules,
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
  apiRouter.get("/tournaments/upcoming", async (_req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const tournaments2 = await storage.getAllTournaments();
      const upcomingTournaments = tournaments2.filter((t) => {
        const startTime = new Date(t.startTime);
        return startTime > now;
      });
      const tournamentsWithCounts = await Promise.all(
        upcomingTournaments.map(async (tournament) => {
          const participants2 = await storage.getParticipantsByTournament(tournament.id);
          return {
            id: tournament.id,
            name: tournament.name,
            startTime: tournament.startTime,
            endTime: tournament.endTime,
            entryFee: tournament.entryFee,
            prizePool: tournament.prizePool,
            description: tournament.description,
            participantCount: participants2.length,
            totalSlots: tournament.totalSlots,
            rules: tournament.rules
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
  apiRouter.post("/auth/create-admin", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }
      const salt = await bcrypt3.genSalt(10);
      const hashedPassword = await bcrypt3.hash(password, salt);
      const userData = {
        username,
        email,
        password: hashedPassword,
        googleId: null,
        // Explicitly set as null
        fullName: null,
        mobileNumber: null,
        accountNumber: null,
        accountIfsc: null,
        upiId: null,
        profilePhoto: null,
        telegramId: null
      };
      const adminUser = await storage.createUser(userData, true);
      const token = generateToken(adminUser);
      const { password: _, ...userDataWithoutPassword } = adminUser;
      res.status(201).json({
        user: userDataWithoutPassword,
        token
      });
    } catch (error) {
      console.error("Admin creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/auth/user", authenticateJWT, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userData } = user;
      return res.json({
        user: userData
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/tournaments", async (req, res) => {
    try {
      const tournaments2 = await storage.getAllTournaments();
      res.json(tournaments2);
    } catch (error) {
      console.error("Error in /api/tournaments:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  apiRouter.get("/tournaments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const tournament = await storage.getTournament(id);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/tournaments", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(validatedData);
      res.status(201).json(tournament);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.put("/tournaments/:id", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const validatedData = insertTournamentSchema.partial().parse(req.body);
      const tournament = await storage.updateTournament(id, validatedData);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.delete("/tournaments/:id", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const success = await storage.deleteTournament(id);
      if (!success) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json({ message: "Tournament deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/tournaments/:id/publish-results", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const tournament = await storage.publishResults(id);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json({ message: "Results published successfully", tournament });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/tournaments/:id/quiz", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const quiz = await storage.getQuizByTournament(tournamentId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found for this tournament" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/quizzes", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertQuizSchema.parse(req.body);
      const tournament = await storage.getTournament(validatedData.tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      const existingQuiz = await storage.getQuizByTournament(validatedData.tournamentId);
      if (existingQuiz) {
        return res.status(400).json({ message: "A quiz already exists for this tournament" });
      }
      const quiz = await storage.createQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.put("/quizzes/:id", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      const validatedData = insertQuizSchema.partial().parse(req.body);
      const quiz = await storage.updateQuiz(id, validatedData);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.delete("/quizzes/:id", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      const success = await storage.deleteQuiz(id);
      if (!success) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/quizzes/:id/questions", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      const questions2 = await storage.getQuestionsByQuiz(quizId);
      const sanitizedQuestions = questions2.map((q) => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
      res.json(sanitizedQuestions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/admin/quizzes/:id/questions", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      const questions2 = await storage.getQuestionsByQuiz(quizId);
      res.json(questions2);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/questions", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const quiz = await storage.getQuiz(validatedData.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.put("/questions/:id", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(id, validatedData);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.delete("/questions/:id", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      const success = await storage.deleteQuestion(id);
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/tournaments/:id/join", authenticateJWT, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const userId = req.user.userId;
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      const existingParticipant = await storage.getParticipantByUserAndTournament(userId, tournamentId);
      if (existingParticipant && existingParticipant.paymentStatus === "completed") {
        return res.status(400).json({ message: "You have already joined this tournament" });
      }
      const participants2 = await storage.getParticipantsByTournament(tournamentId);
      if (participants2.length >= tournament.totalSlots) {
        return res.status(400).json({ message: "Tournament is full" });
      }
      const now = /* @__PURE__ */ new Date();
      if (tournament.startTime < now) {
        return res.status(400).json({ message: "Tournament has already started" });
      }
      const { method } = req.body;
      if (!method || !["wallet", "paytm", "upi"].includes(method)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let paymentStatus = "pending";
      if (method === "wallet") {
        const entryFee = parseFloat(tournament.entryFee);
        const walletBalance = parseFloat(user.wallet);
        if (walletBalance < entryFee) {
          return res.status(400).json({ message: "Insufficient wallet balance" });
        }
        await storage.updateUserWallet(userId, -entryFee);
        paymentStatus = "success";
      } else {
        paymentStatus = "success";
      }
      const payment = await storage.createPayment({
        userId,
        tournamentId,
        amount: tournament.entryFee,
        status: paymentStatus,
        method,
        transactionId: `tx-${Date.now()}`
      });
      if (paymentStatus === "success") {
        await storage.addParticipant({
          userId,
          tournamentId,
          paymentStatus: "completed"
        });
      }
      res.json({ message: "Tournament joined successfully", payment });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/tournaments/:id/participants", authenticateJWT, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      const participants2 = await storage.getParticipantsByTournament(tournamentId);
      const participantsWithUserInfo = await Promise.all(
        participants2.map(async (participant) => {
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
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/tournaments/:id/start-quiz", authenticateJWT, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const userId = req.user.userId;
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      const now = /* @__PURE__ */ new Date();
      if (tournament.startTime > now) {
        return res.status(400).json({ message: "Tournament has not started yet" });
      }
      if (tournament.endTime < now) {
        return res.status(400).json({ message: "Tournament has already ended" });
      }
      const participant = await storage.getParticipantByUserAndTournament(userId, tournamentId);
      if (!participant || participant.paymentStatus !== "completed") {
        return res.status(403).json({ message: "You must join this tournament first" });
      }
      if (participant.hasAttempted) {
        return res.status(400).json({ message: "You have already attempted this quiz" });
      }
      const quiz = await storage.getQuizByTournament(tournamentId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found for this tournament" });
      }
      const questions2 = await storage.getQuestionsByQuiz(quiz.id);
      if (questions2.length === 0) {
        return res.status(404).json({ message: "No questions found for this quiz" });
      }
      const sanitizedQuestions = questions2.map((q) => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
      res.json({
        quiz,
        questions: sanitizedQuestions,
        totalQuestions: questions2.length
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/tournaments/:id/submit-answer", authenticateJWT, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const userId = req.user.userId;
      const { questionId, answerIndex, timeTaken } = req.body;
      if (typeof questionId !== "number" || typeof answerIndex !== "number" || typeof timeTaken !== "number") {
        return res.status(400).json({ message: "Invalid request body" });
      }
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      const now = /* @__PURE__ */ new Date();
      if (tournament.startTime > now || tournament.endTime < now) {
        return res.status(400).json({ message: "Tournament is not active" });
      }
      const participant = await storage.getParticipantByUserAndTournament(userId, tournamentId);
      if (!participant || participant.paymentStatus !== "completed") {
        return res.status(403).json({ message: "You must join this tournament first" });
      }
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      const isCorrect = question.correctAnswer === answerIndex;
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
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/tournaments/:id/finish-quiz", authenticateJWT, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const userId = req.user.userId;
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      const participant = await storage.getParticipantByUserAndTournament(userId, tournamentId);
      if (!participant || participant.paymentStatus !== "completed") {
        return res.status(403).json({ message: "You must join this tournament first" });
      }
      const responses = await storage.getUserResponsesByUserAndTournament(userId, tournamentId);
      const correctAnswers = responses.filter((r) => r.isCorrect).length;
      const totalTimeTaken = responses.reduce((total, r) => total + r.timeTaken, 0);
      await storage.updateParticipantScore(userId, tournamentId, correctAnswers, totalTimeTaken);
      res.json({
        message: "Quiz finished successfully",
        score: correctAnswers,
        totalQuestions: responses.length,
        timeTaken: totalTimeTaken
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/tournaments/:id/leaderboard", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      if (!tournament.resultPublished && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Results have not been published yet" });
      }
      const leaderboard = await storage.getTournamentLeaderboard(tournamentId);
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
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/wallet", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        wallet: user.wallet
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/wallet/add", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { amount } = req.body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      const user = await storage.updateUserWallet(userId, amount);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        message: `\u20B9${amount} added to wallet successfully`,
        wallet: user.wallet
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/profile", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.put("/profile", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError2(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      const profileData = result.data;
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userProfile } = updatedUser;
      res.json({
        message: "Profile updated successfully",
        profile: userProfile
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.post("/profile/photo", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { photo } = req.body;
      if (!photo || typeof photo !== "string") {
        return res.status(400).json({ message: "Invalid photo data" });
      }
      if (!photo.startsWith("data:image/")) {
        return res.status(400).json({ message: "Invalid image format" });
      }
      const updatedUser = await storage.updateUserProfile(userId, { profilePhoto: photo });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        message: "Profile photo updated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  apiRouter.get("/admin/stats", authenticateJWT, requireAdmin, async (req, res) => {
    try {
      const tournaments2 = await storage.getAllTournaments();
      const liveTournaments = await storage.getLiveTournaments();
      const allParticipants = Array.from(new Set(
        (await Promise.all(tournaments2.map((t) => storage.getParticipantsByTournament(t.id)))).flat().map((p) => p.userId)
      ));
      const totalRevenue = (await Promise.all(tournaments2.map((t) => storage.getPaymentsByTournament(t.id)))).flat().filter((p) => p.status === "success").reduce((total, p) => total + parseFloat(p.amount), 0);
      res.json({
        totalTournaments: tournaments2.length,
        liveTournaments: liveTournaments.length,
        totalParticipants: allParticipants.length,
        totalRevenue
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig(async () => {
  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
        await import("@replit/vite-plugin-cartographer").then(
          (m) => m.cartographer()
        )
      ] : []
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets")
      }
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true
    }
  };
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
var app = express3();
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express3.json({ limit: "10mb" }));
app.use(express3.urlencoded({ extended: true, limit: "10mb" }));
app.use((err, _req, res, next) => {
  console.error("Error:", err);
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  next(err);
});
var proxyOptions = {
  target: "https://extensions.aitopia.ai",
  changeOrigin: true,
  pathRewrite: { "^/api/external": "" },
  logLevel: "error"
};
app.use("/api/external", createProxyMiddleware(proxyOptions));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      console.error("Error stack:", err.stack);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = process.env.PORT || 5e3;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`Server is running on port ${port}`);
    });
    server.on("error", (error) => {
      if (error.syscall !== "listen") {
        throw error;
      }
      switch (error.code) {
        case "EACCES":
          console.error(`Port ${port} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          console.error(`Port ${port} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
