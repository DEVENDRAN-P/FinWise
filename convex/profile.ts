import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create user profile if it doesn't exist
export const createUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) return existingProfile._id;

    const user = await ctx.db.get(userId);
    return await ctx.db.insert("userProfiles", {
      userId,
      displayName: user?.name || user?.email || "Student",
      totalCoins: 0,
      level: 1,
      completedLessons: [],
      badges: [],
      currentStreak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
    });
  },
});

// Get user profile with stats
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    let userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile) return null;

    // Get additional stats
    const totalLessons = await ctx.db.query("lessons").filter(q => q.eq(q.field("isActive"), true)).collect();
    const quizAttempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalSimulations = await ctx.db
      .query("loanSimulations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      ...userProfile,
      stats: {
        totalLessons: totalLessons.length,
        completedLessons: userProfile.completedLessons.length,
        completionRate: totalLessons.length > 0 ? 
          Math.round((userProfile.completedLessons.length / totalLessons.length) * 100) : 0,
        totalQuizzes: quizAttempts.length,
        averageScore: quizAttempts.length > 0 ? 
          Math.round(quizAttempts.reduce((sum, attempt) => 
            sum + (attempt.score / attempt.totalQuestions), 0) / quizAttempts.length * 100) : 0,
        totalSimulations: totalSimulations.length,
      },
    };
  },
});

// Get leaderboard
export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const profiles = await ctx.db
      .query("userProfiles")
      .order("desc")
      .take(50); // Get more to sort properly

    // Sort by coins and assign ranks
    const sortedProfiles = profiles
      .sort((a, b) => b.totalCoins - a.totalCoins)
      .slice(0, limit)
      .map((profile, index) => ({
        ...profile,
        rank: index + 1,
      }));

    return sortedProfiles;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile) throw new Error("Profile not found");

    const updates: any = {};
    if (args.displayName) updates.displayName = args.displayName;

    await ctx.db.patch(userProfile._id, updates);
    return true;
  },
});

// Get user achievements
export const getUserAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const achievements = await Promise.all(
      userAchievements.map(async (ua) => {
        const achievement = await ctx.db.get(ua.achievementId);
        return {
          ...achievement,
          unlockedAt: ua.unlockedAt,
        };
      })
    );

    return achievements.filter(a => a !== null);
  },
});
