import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tournament schema
export const tournaments = pgTable("tournaments", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz schema
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Question schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of options
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option
  timer: integer("timer").notNull(), // Time in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Participant schema (users who joined a tournament)
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed, failed
  score: integer("score").default(0),
  timeTaken: integer("time_taken").default(0), // In seconds
  prize: numeric("prize", { precision: 10, scale: 2 }).default("0").notNull(),
  hasAttempted: boolean("has_attempted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    unq: uniqueIndex("participants_user_tournament_idx").on(table.userId, table.tournamentId),
  };
});

// User responses to questions
export const userResponses = pgTable("user_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  answerIndex: integer("answer_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeTaken: integer("time_taken").notNull(), // Time taken to answer in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    unq: uniqueIndex("user_response_idx").on(table.userId, table.questionId, table.tournamentId),
  };
});

// Payment transactions
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // success, failed, pending
  method: text("method").notNull(), // wallet, paytm, upi
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas and types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isAdmin: true,
  wallet: true,
});

// Profile update schema
export const updateProfileSchema = z.object({
  fullName: z.string().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountIfsc: z.string().optional().nullable(),
  upiId: z.string().optional().nullable(),
  telegramId: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true, 
  createdAt: true,
  isPublished: true,
  resultPublished: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
  score: true,
  timeTaken: true,
  prize: true,
  hasAttempted: true
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertUserResponseSchema = createInsertSchema(userResponses).omit({
  id: true,
  createdAt: true,
});

// Types for insert and select
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type User = typeof users.$inferSelect;

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertUserResponse = z.infer<typeof insertUserResponseSchema>;
export type UserResponse = typeof userResponses.$inferSelect;
