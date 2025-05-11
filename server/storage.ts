import { 
  User, InsertUser, 
  Tournament, InsertTournament, 
  Quiz, InsertQuiz, 
  Question, InsertQuestion, 
  Participant, InsertParticipant, 
  Payment, InsertPayment,
  UserResponse, InsertUserResponse
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(userId: number, amount: number): Promise<User | undefined>;
  updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined>;
  
  // Tournament operations
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  getTournament(id: number): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  getLiveTournaments(): Promise<Tournament[]>;
  getUpcomingTournaments(): Promise<Tournament[]>;
  updateTournament(id: number, tournament: Partial<InsertTournament>): Promise<Tournament | undefined>;
  deleteTournament(id: number): Promise<boolean>;
  publishResults(id: number): Promise<Tournament | undefined>;
  
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizByTournament(tournamentId: number): Promise<Quiz | undefined>;
  updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByQuiz(quizId: number): Promise<Question[]>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Participant operations
  addParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipantsByTournament(tournamentId: number): Promise<Participant[]>;
  getParticipantByUserAndTournament(userId: number, tournamentId: number): Promise<Participant | undefined>;
  updateParticipantScore(userId: number, tournamentId: number, score: number, timeTaken: number): Promise<Participant | undefined>;
  updateParticipantPrize(userId: number, tournamentId: number, prize: number): Promise<Participant | undefined>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPaymentsByTournament(tournamentId: number): Promise<Payment[]>;
  
  // User Response operations
  saveUserResponse(response: InsertUserResponse): Promise<UserResponse>;
  getUserResponsesByUserAndTournament(userId: number, tournamentId: number): Promise<UserResponse[]>;
  
  // Leaderboard
  getTournamentLeaderboard(tournamentId: number): Promise<Participant[]>;
  getRecentWinners(): Promise<Participant[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tournaments: Map<number, Tournament>;
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  private participants: Map<number, Participant>;
  private payments: Map<number, Payment>;
  private userResponses: Map<number, UserResponse>;
  
  private userId: number;
  private tournamentId: number;
  private quizId: number;
  private questionId: number;
  private participantId: number;
  private paymentId: number;
  private userResponseId: number;

  constructor() {
    this.users = new Map();
    this.tournaments = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.participants = new Map();
    this.payments = new Map();
    this.userResponses = new Map();
    
    this.userId = 1;
    this.tournamentId = 1;
    this.quizId = 1;
    this.questionId = 1;
    this.participantId = 1;
    this.paymentId = 1;
    this.userResponseId = 1;
    
    // Initialize with admin user
    const adminUser: User = {
      id: this.userId++,
      username: "admin",
      email: "admin@quiztournament.com",
      password: "$2a$10$x5mKrnBKfVN3I9oI7KRZxeU5v.tN0aeY0BYQFJTpfeKzXa.rHr1YS", // "admin123"
      isAdmin: true,
      wallet: "1000",
      createdAt: new Date(),
      googleId: null
    };
    this.users.set(adminUser.id, adminUser);
    
    // Initialize with some tournaments for testing
    this.createInitialData();
  }

  private createInitialData() {
    // Create sample tournaments
    const now = new Date();
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in2Days = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
    // Live tournament 1
    const tournament1: Tournament = {
      id: this.tournamentId++,
      name: "General Knowledge Masters",
      description: "Test your general knowledge with this exciting tournament!",
      entryFee: "100",
      prizePool: "10000",
      totalSlots: 200,
      startTime: now,
      endTime: in2Hours,
      isPublished: true,
      resultPublished: false,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
    };
    this.tournaments.set(tournament1.id, tournament1);
    
    // Live tournament 2
    const tournament2: Tournament = {
      id: this.tournamentId++,
      name: "Sports Quiz Champions",
      description: "Sports trivia for all the sports enthusiasts!",
      entryFee: "200",
      prizePool: "15000",
      totalSlots: 100,
      startTime: now,
      endTime: in1Hour,
      isPublished: true,
      resultPublished: false,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
    };
    this.tournaments.set(tournament2.id, tournament2);
    
    // Upcoming tournament 1
    const tournament3: Tournament = {
      id: this.tournamentId++,
      name: "Movie Buff Challenge",
      description: "Test your knowledge about movies and cinema!",
      entryFee: "50",
      prizePool: "5000",
      totalSlots: 150,
      startTime: in1Day,
      endTime: new Date(in1Day.getTime() + 2 * 60 * 60 * 1000),
      isPublished: true,
      resultPublished: false,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
    };
    this.tournaments.set(tournament3.id, tournament3);
    
    // Upcoming tournament 2
    const tournament4: Tournament = {
      id: this.tournamentId++,
      name: "Science & Technology",
      description: "Science & tech quiz for the nerds!",
      entryFee: "150",
      prizePool: "8000",
      totalSlots: 100,
      startTime: in2Days,
      endTime: new Date(in2Days.getTime() + 2 * 60 * 60 * 1000),
      isPublished: true,
      resultPublished: false,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
    };
    this.tournaments.set(tournament4.id, tournament4);
    
    // Create sample quizzes
    for (let i = 1; i <= 4; i++) {
      const quiz: Quiz = {
        id: this.quizId++,
        tournamentId: i,
        title: `Quiz for ${this.tournaments.get(i)?.name}`,
        createdAt: new Date()
      };
      this.quizzes.set(quiz.id, quiz);
      
      // Create sample questions
      const options = [
        ["Option 1", "Option 2", "Option 3", "Option 4"],
        ["Paris", "London", "Berlin", "Madrid"],
        ["Blue", "Red", "Green", "Yellow"],
        ["Mercury", "Venus", "Earth", "Mars"]
      ];
      
      for (let j = 0; j < 15; j++) {
        const optionSet = options[j % options.length];
        const question: Question = {
          id: this.questionId++,
          quizId: quiz.id,
          question: `Question ${j + 1} for Tournament ${i}?`,
          options: optionSet,
          correctAnswer: Math.floor(Math.random() * 4),
          timer: [10, 15, 20, 30][Math.floor(Math.random() * 4)],
          createdAt: new Date()
        };
        this.questions.set(question.id, question);
      }
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }
  
  async createUser(insertUser: InsertUser, isAdmin: boolean = false): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin,
      wallet: "0",
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserWallet(userId: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const newBalance = parseFloat(user.wallet) + amount;
    const updatedUser: User = {
      ...user,
      wallet: newBalance.toString()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...profileData,
      // Ensure these fields don't get overwritten
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      isAdmin: user.isAdmin,
      wallet: user.wallet,
      createdAt: user.createdAt
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Tournament operations
  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = this.tournamentId++;
    const tournament: Tournament = {
      ...insertTournament,
      id,
      isPublished: false,
      resultPublished: false,
      createdAt: new Date()
    };
    this.tournaments.set(id, tournament);
    return tournament;
  }
  
  async getTournament(id: number): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }
  
  async getAllTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }
  
  async getLiveTournaments(): Promise<Tournament[]> {
    const now = new Date();
    return Array.from(this.tournaments.values()).filter(
      (tournament) => tournament.isPublished && tournament.startTime <= now && tournament.endTime >= now
    );
  }
  
  async getUpcomingTournaments(): Promise<Tournament[]> {
    const now = new Date();
    return Array.from(this.tournaments.values()).filter(
      (tournament) => tournament.isPublished && tournament.startTime > now
    );
  }
  
  async updateTournament(id: number, tournamentUpdate: Partial<InsertTournament>): Promise<Tournament | undefined> {
    const tournament = this.tournaments.get(id);
    if (!tournament) return undefined;
    
    const updatedTournament: Tournament = {
      ...tournament,
      ...tournamentUpdate
    };
    
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }
  
  async deleteTournament(id: number): Promise<boolean> {
    return this.tournaments.delete(id);
  }
  
  async publishResults(id: number): Promise<Tournament | undefined> {
    const tournament = this.tournaments.get(id);
    if (!tournament) return undefined;
    
    const updatedTournament: Tournament = {
      ...tournament,
      resultPublished: true
    };
    
    this.tournaments.set(id, updatedTournament);
    
    // Calculate prizes
    const participants = await this.getParticipantsByTournament(id);
    
    // Sort by score (desc) and time taken (asc)
    participants.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.timeTaken - b.timeTaken;
    });
    
    // Distribute prizes (simplified)
    const totalPrize = parseFloat(tournament.prizePool);
    const prizeDistribution = [0.5, 0.3, 0.15]; // 50%, 30%, 15% for top 3
    
    participants.slice(0, 3).forEach((participant, index) => {
      const prize = totalPrize * prizeDistribution[index];
      this.updateParticipantPrize(participant.userId, id, prize);
      this.updateUserWallet(participant.userId, prize);
    });
    
    return updatedTournament;
  }
  
  // Quiz operations
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizId++;
    const quiz: Quiz = {
      ...insertQuiz,
      id,
      createdAt: new Date()
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }
  
  async getQuizByTournament(tournamentId: number): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(
      (quiz) => quiz.tournamentId === tournamentId
    );
  }
  
  async updateQuiz(id: number, quizUpdate: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return undefined;
    
    const updatedQuiz: Quiz = {
      ...quiz,
      ...quizUpdate
    };
    
    this.quizzes.set(id, updatedQuiz);
    return updatedQuiz;
  }
  
  async deleteQuiz(id: number): Promise<boolean> {
    return this.quizzes.delete(id);
  }
  
  // Question operations
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionId++;
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: new Date()
    };
    this.questions.set(id, question);
    return question;
  }
  
  async getQuestionsByQuiz(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.quizId === quizId
    );
  }
  
  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion: Question = {
      ...question,
      ...questionUpdate
    };
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  // Participant operations
  async addParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    // Check if user already joined this tournament
    const existing = await this.getParticipantByUserAndTournament(
      insertParticipant.userId,
      insertParticipant.tournamentId
    );
    
    if (existing) {
      return existing;
    }
    
    const id = this.participantId++;
    const participant: Participant = {
      ...insertParticipant,
      id,
      score: 0,
      timeTaken: 0,
      prize: "0",
      hasAttempted: false,
      createdAt: new Date()
    };
    this.participants.set(id, participant);
    return participant;
  }
  
  async getParticipantsByTournament(tournamentId: number): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      (participant) => participant.tournamentId === tournamentId
    );
  }
  
  async getParticipantByUserAndTournament(userId: number, tournamentId: number): Promise<Participant | undefined> {
    return Array.from(this.participants.values()).find(
      (participant) => participant.userId === userId && participant.tournamentId === tournamentId
    );
  }
  
  async updateParticipantScore(userId: number, tournamentId: number, score: number, timeTaken: number): Promise<Participant | undefined> {
    const participant = await this.getParticipantByUserAndTournament(userId, tournamentId);
    if (!participant) return undefined;
    
    const updatedParticipant: Participant = {
      ...participant,
      score,
      timeTaken,
      hasAttempted: true
    };
    
    this.participants.set(participant.id, updatedParticipant);
    return updatedParticipant;
  }
  
  async updateParticipantPrize(userId: number, tournamentId: number, prize: number): Promise<Participant | undefined> {
    const participant = await this.getParticipantByUserAndTournament(userId, tournamentId);
    if (!participant) return undefined;
    
    const updatedParticipant: Participant = {
      ...participant,
      prize: prize.toString()
    };
    
    this.participants.set(participant.id, updatedParticipant);
    return updatedParticipant;
  }
  
  // Payment operations
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentId++;
    const payment: Payment = {
      ...insertPayment,
      id,
      createdAt: new Date()
    };
    this.payments.set(id, payment);
    
    // If payment is successful, update participant status
    if (payment.status === "success") {
      await this.addParticipant({
        userId: payment.userId,
        tournamentId: payment.tournamentId,
        paymentStatus: "completed"
      });
    }
    
    return payment;
  }
  
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId
    );
  }
  
  async getPaymentsByTournament(tournamentId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.tournamentId === tournamentId
    );
  }
  
  // User Response operations
  async saveUserResponse(insertUserResponse: InsertUserResponse): Promise<UserResponse> {
    const id = this.userResponseId++;
    const userResponse: UserResponse = {
      ...insertUserResponse,
      id,
      createdAt: new Date()
    };
    this.userResponses.set(id, userResponse);
    return userResponse;
  }
  
  async getUserResponsesByUserAndTournament(userId: number, tournamentId: number): Promise<UserResponse[]> {
    return Array.from(this.userResponses.values()).filter(
      (response) => response.userId === userId && response.tournamentId === tournamentId
    );
  }
  
  // Leaderboard
  async getTournamentLeaderboard(tournamentId: number): Promise<Participant[]> {
    const participants = await this.getParticipantsByTournament(tournamentId);
    
    // Sort by score (desc) and time taken (asc)
    return participants
      .filter(participant => participant.hasAttempted)
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.timeTaken - b.timeTaken;
      });
  }
  
  async getRecentWinners(): Promise<Participant[]> {
    const allParticipants = Array.from(this.participants.values());
    const winners = allParticipants.filter(participant => parseFloat(participant.prize) > 0);
    
    // Sort by prize amount (desc)
    return winners.sort((a, b) => parseFloat(b.prize) - parseFloat(a.prize)).slice(0, 10);
  }
}

import connectPg from "connect-pg-simple";
import session from "express-session";
import { db } from "./db";
import { pool } from "./db";
import { eq, desc, and, isNull, not } from "drizzle-orm";
import { users, tournaments, quizzes, questions, participants, payments, userResponses } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

type SessionStore = import('express-session').Store;

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser, isAdmin: boolean = false): Promise<User> {
    // Include the isAdmin flag in the data to insert
    const userData = {
      ...insertUser,
      isAdmin: isAdmin, // Explicitly use boolean value to make sure it's set correctly
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
    
    // Double-check and update the isAdmin flag if needed
    if (isAdmin && !user.isAdmin) {
      // Update the user's admin status in the database
      const [updatedUser] = await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, user.id))
        .returning();
      return updatedUser;
    }
    
    return user;
  }

  async updateUserWallet(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const walletBalance = parseFloat(user.wallet) + amount;
    const [updatedUser] = await db
      .update(users)
      .set({ wallet: walletBalance.toString() })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  async updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Make sure we're not updating critical fields
    const safeProfileData = { ...profileData };
    delete safeProfileData.id;
    delete safeProfileData.username;
    delete safeProfileData.email;
    delete safeProfileData.password;
    delete safeProfileData.isAdmin;
    delete safeProfileData.wallet;
    delete safeProfileData.createdAt;
    
    const [updatedUser] = await db
      .update(users)
      .set(safeProfileData)
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  // Tournament operations
  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const [tournament] = await db.insert(tournaments).values(insertTournament).returning();
    return tournament;
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament || undefined;
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments).orderBy(desc(tournaments.startTime));
  }

  async getLiveTournaments(): Promise<Tournament[]> {
    const now = new Date();
    return await db
      .select()
      .from(tournaments)
      .where(
        and(
          eq(tournaments.isPublished, true),
          not(eq(tournaments.resultPublished, true))
        )
      )
      .orderBy(tournaments.startTime);
  }

  async getUpcomingTournaments(): Promise<Tournament[]> {
    const now = new Date();
    return await db
      .select()
      .from(tournaments)
      .where(
        and(
          eq(tournaments.isPublished, true),
          not(eq(tournaments.resultPublished, true))
        )
      )
      .orderBy(tournaments.startTime);
  }

  async updateTournament(id: number, tournament: Partial<InsertTournament>): Promise<Tournament | undefined> {
    const [updatedTournament] = await db
      .update(tournaments)
      .set(tournament)
      .where(eq(tournaments.id, id))
      .returning();

    return updatedTournament || undefined;
  }

  async deleteTournament(id: number): Promise<boolean> {
    try {
      await db.delete(tournaments).where(eq(tournaments.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  async publishResults(id: number): Promise<Tournament | undefined> {
    const [updatedTournament] = await db
      .update(tournaments)
      .set({ 
        resultPublished: true 
      })
      .where(eq(tournaments.id, id))
      .returning();

    return updatedTournament || undefined;
  }

  // Quiz operations
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async getQuizByTournament(tournamentId: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.tournamentId, tournamentId));
    return quiz || undefined;
  }

  async updateQuiz(id: number, quizUpdate: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set(quizUpdate)
      .where(eq(quizzes.id, id))
      .returning();

    return updatedQuiz || undefined;
  }

  async deleteQuiz(id: number): Promise<boolean> {
    try {
      await db.delete(quizzes).where(eq(quizzes.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Question operations
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async getQuestionsByQuiz(quizId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.quizId, quizId));
  }

  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(questionUpdate)
      .where(eq(questions.id, id))
      .returning();

    return updatedQuestion || undefined;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    try {
      await db.delete(questions).where(eq(questions.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Participant operations
  async addParticipant(participant: InsertParticipant): Promise<Participant> {
    const [newParticipant] = await db.insert(participants).values(participant).returning();
    return newParticipant;
  }

  async getParticipantsByTournament(tournamentId: number): Promise<Participant[]> {
    return await db.select().from(participants).where(eq(participants.tournamentId, tournamentId));
  }

  async getParticipantByUserAndTournament(userId: number, tournamentId: number): Promise<Participant | undefined> {
    const [participant] = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.tournamentId, tournamentId)
        )
      );
    
    return participant || undefined;
  }

  async updateParticipantScore(userId: number, tournamentId: number, score: number, timeTaken: number): Promise<Participant | undefined> {
    const [updatedParticipant] = await db
      .update(participants)
      .set({ 
        score, 
        timeTaken, 
        hasAttempted: true 
      })
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.tournamentId, tournamentId)
        )
      )
      .returning();

    return updatedParticipant || undefined;
  }

  async updateParticipantPrize(userId: number, tournamentId: number, prize: number): Promise<Participant | undefined> {
    const [updatedParticipant] = await db
      .update(participants)
      .set({ prize: prize.toString() })
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.tournamentId, tournamentId)
        )
      )
      .returning();

    return updatedParticipant || undefined;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async getPaymentsByTournament(tournamentId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.tournamentId, tournamentId));
  }

  // User Response operations
  async saveUserResponse(response: InsertUserResponse): Promise<UserResponse> {
    const [newResponse] = await db.insert(userResponses).values(response).returning();
    return newResponse;
  }

  async getUserResponsesByUserAndTournament(userId: number, tournamentId: number): Promise<UserResponse[]> {
    return await db
      .select()
      .from(userResponses)
      .where(
        and(
          eq(userResponses.userId, userId),
          eq(userResponses.tournamentId, tournamentId)
        )
      );
  }

  // Leaderboard
  async getTournamentLeaderboard(tournamentId: number): Promise<Participant[]> {
    // Get participants with their scores for this tournament
    const leaderboard = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.tournamentId, tournamentId),
          eq(participants.hasAttempted, true),
          not(isNull(participants.score))
        )
      )
      .orderBy(desc(participants.score)); // Order by score descending

    return leaderboard;
  }

  async getRecentWinners(): Promise<Participant[]> {
    // Get top participants from completed tournaments
    const winners = await db
      .select()
      .from(participants)
      .where(not(eq(participants.prize, '0')))
      .orderBy(desc(participants.createdAt))
      .limit(5);

    return winners;
  }
}

export const storage = new DatabaseStorage();
