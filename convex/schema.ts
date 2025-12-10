import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with progress tracking
  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    totalCoins: v.number(),
    level: v.number(),
    completedLessons: v.array(v.string()),
    badges: v.array(v.string()),
    currentStreak: v.number(),
    lastActiveDate: v.string(),
  }).index("by_user", ["userId"]),

  // Financial literacy lessons
  lessons: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(), // "savings", "loans", "credit", "investment", "budgeting"
    difficulty: v.string(), // "beginner", "intermediate", "advanced"
    content: v.string(),
    coinReward: v.number(),
    estimatedTime: v.number(), // in minutes
    isActive: v.boolean(),
  }).index("by_category", ["category"])
    .index("by_difficulty", ["difficulty"]),

  // Quiz questions for lessons
  quizQuestions: defineTable({
    lessonId: v.id("lessons"),
    question: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
    explanation: v.string(),
    points: v.number(),
  }).index("by_lesson", ["lessonId"]),

  // User quiz attempts and scores
  quizAttempts: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    score: v.number(),
    totalQuestions: v.number(),
    completedAt: v.number(),
    timeSpent: v.number(), // in seconds
  }).index("by_user", ["userId"])
    .index("by_lesson", ["lessonId"]),

  // Loan simulations
  loanSimulations: defineTable({
    userId: v.id("users"),
    loanAmount: v.number(),
    interestRate: v.number(),
    tenure: v.number(), // in months
    emiAmount: v.number(),
    totalInterest: v.number(),
    totalAmount: v.number(),
    simulationType: v.string(), // "personal", "home", "car", "education"
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Achievements and badges
  achievements: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    requirement: v.string(),
    coinReward: v.number(),
    category: v.string(),
  }),

  // User achievements
  userAchievements: defineTable({
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    unlockedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Leaderboard entries
  leaderboard: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    totalCoins: v.number(),
    level: v.number(),
    rank: v.number(),
    updatedAt: v.number(),
  }).index("by_rank", ["rank"])
    .index("by_coins", ["totalCoins"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
