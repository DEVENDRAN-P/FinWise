import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Get all lessons by category
export const getLessonsByCategory = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let lessons;
    
    if (args.category) {
      lessons = await ctx.db
        .query("lessons")
        .withIndex("by_category", (q) => q.eq("category", args.category as string))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      lessons = await ctx.db
        .query("lessons")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
    
    // Get user progress
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const completedLessons = userProfile?.completedLessons || [];

    return lessons.map(lesson => ({
      ...lesson,
      isCompleted: completedLessons.includes(lesson._id),
    }));
  },
});

// Get lesson categories
export const getLessonCategories = query({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    const categories = [...new Set(lessons.map(lesson => lesson.category))];
    
    const categoryData = await Promise.all(
      categories.map(async (category) => {
        const categoryLessons = lessons.filter(l => l.category === category);
        return {
          name: category,
          count: categoryLessons.length,
          totalCoins: categoryLessons.reduce((sum, l) => sum + l.coinReward, 0),
        };
      })
    );

    return categoryData;
  },
});

// Get quiz questions for a lesson
export const getQuizQuestions = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("quizQuestions")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
  },
});

// Submit quiz attempt
export const submitQuizAttempt = mutation({
  args: {
    lessonId: v.id("lessons"),
    score: v.number(),
    totalQuestions: v.number(),
    timeSpent: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Record quiz attempt
    await ctx.db.insert("quizAttempts", {
      userId,
      lessonId: args.lessonId,
      score: args.score,
      totalQuestions: args.totalQuestions,
      completedAt: Date.now(),
      timeSpent: args.timeSpent,
    });

    // Get lesson details
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    // Update user profile
    let userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile) {
      // Create new profile
      const user = await ctx.db.get(userId);
      const profileId = await ctx.db.insert("userProfiles", {
        userId,
        displayName: user?.name || user?.email || "Student",
        totalCoins: 0,
        level: 1,
        completedLessons: [],
        badges: [],
        currentStreak: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
      });
      userProfile = await ctx.db.get(profileId);
    }

    if (!userProfile) throw new Error("Failed to create user profile");

    // Calculate coins earned (based on score percentage)
    const scorePercentage = args.score / args.totalQuestions;
    const coinsEarned = Math.floor(lesson.coinReward * scorePercentage);

    // Check if lesson is already completed
    const isNewCompletion = !userProfile.completedLessons.includes(args.lessonId);
    
    if (isNewCompletion && scorePercentage >= 0.7) { // 70% to pass
      // Mark lesson as completed and award coins
      await ctx.db.patch(userProfile._id, {
        totalCoins: userProfile.totalCoins + coinsEarned,
        completedLessons: [...userProfile.completedLessons, args.lessonId],
        level: Math.floor((userProfile.totalCoins + coinsEarned) / 100) + 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
      });

      return {
        success: true,
        coinsEarned,
        passed: true,
        isNewCompletion: true,
      };
    }

    return {
      success: true,
      coinsEarned: isNewCompletion ? coinsEarned : 0,
      passed: scorePercentage >= 0.7,
      isNewCompletion: false,
    };
  },
});

// Initialize sample lessons
export const initializeLessons = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete existing data for fresh initialization
    const existingLessons = await ctx.db.query("lessons").collect();
    for (const lesson of existingLessons) {
      // Delete quiz questions for this lesson
      const questions = await ctx.db
        .query("quizQuestions")
        .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
        .collect();
      for (const q of questions) {
        await ctx.db.delete(q._id);
      }
      // Delete lesson
      await ctx.db.delete(lesson._id);
    }

    const sampleLessons = [
      {
        title: "Understanding Money Basics",
        description: "Learn what money is and how it works in daily life",
        category: "basics",
        difficulty: "beginner",
        content: "Money is a medium of exchange that helps us buy goods and services. It has three main functions: medium of exchange, store of value, and unit of account.",
        coinReward: 50,
        estimatedTime: 10,
        isActive: true,
      },
      {
        title: "The Power of Saving",
        description: "Discover why saving money is important and how to start",
        category: "savings",
        difficulty: "beginner",
        content: "Saving money means setting aside a portion of your income for future use. It helps you prepare for emergencies and achieve your goals.",
        coinReward: 75,
        estimatedTime: 15,
        isActive: true,
      },
      {
        title: "Understanding Interest",
        description: "Learn how interest works in savings and loans",
        category: "interest",
        difficulty: "intermediate",
        content: "Interest is the cost of borrowing money or the reward for saving money. Simple interest is calculated on the principal amount, while compound interest is calculated on principal plus accumulated interest.",
        coinReward: 100,
        estimatedTime: 20,
        isActive: true,
      },
      {
        title: "Loans and EMI Explained",
        description: "Understand how loans work and what EMI means",
        category: "loans",
        difficulty: "intermediate",
        content: "A loan is money borrowed that must be repaid with interest. EMI (Equated Monthly Installment) is a fixed payment amount made by a borrower to a lender at a specified date each month.",
        coinReward: 125,
        estimatedTime: 25,
        isActive: true,
      },
      {
        title: "Credit Cards: Benefits and Risks",
        description: "Learn how to use credit cards responsibly",
        category: "credit",
        difficulty: "intermediate",
        content: "Credit cards allow you to borrow money up to a certain limit. They offer convenience and rewards but can lead to debt if not used responsibly.",
        coinReward: 100,
        estimatedTime: 20,
        isActive: true,
      },
    ];

    const lessonIds = [];
    for (const lesson of sampleLessons) {
      const lessonId = await ctx.db.insert("lessons", lesson);
      lessonIds.push(lessonId);

      // Create quiz questions for each lesson
      const quizQuestionsData = getQuizQuestionsForLesson(lesson.title);
      for (const q of quizQuestionsData) {
        await ctx.db.insert("quizQuestions", {
          ...q,
          lessonId,
        });
      }
    }
  },
});

// Helper function to generate quiz questions
function getQuizQuestionsForLesson(lessonTitle: string) {
  const questionsMap: Record<string, any[]> = {
    "Understanding Money Basics": [
      {
        question: "What are the three main functions of money?",
        options: [
          "Counting, dividing, and storing",
          "Medium of exchange, store of value, and unit of account",
          "Buying, selling, and trading",
          "Lending, borrowing, and investing",
        ],
        correctAnswer: 1,
        explanation: "Money serves three key functions: as a medium of exchange, a store of value, and a unit of account.",
        points: 10,
      },
      {
        question: "Which of these is NOT a form of money?",
        options: ["Coins", "Paper currency", "Diamonds", "Bank deposits"],
        correctAnswer: 2,
        explanation: "While diamonds have value, they are not widely accepted as a standard form of money in most economies.",
        points: 10,
      },
      {
        question: "What does 'store of value' mean for money?",
        options: [
          "Money can be kept and used later without losing purchasing power",
          "Money can be used immediately",
          "Money must be used within a day",
          "Money increases in value over time",
        ],
        correctAnswer: 0,
        explanation: "Store of value means you can hold money and use it in the future with relatively stable purchasing power.",
        points: 10,
      },
    ],
    "The Power of Saving": [
      {
        question: "Why is saving money important?",
        options: [
          "To spend more money",
          "To prepare for emergencies and achieve future goals",
          "To avoid paying taxes",
          "To make friends",
        ],
        correctAnswer: 1,
        explanation: "Saving helps you handle unexpected expenses and work towards long-term financial goals.",
        points: 10,
      },
      {
        question: "What is a good approach to saving?",
        options: [
          "Save only when you have extra money",
          "Set aside a fixed portion of your income regularly",
          "Never spend money",
          "Save only for luxuries",
        ],
        correctAnswer: 1,
        explanation: "Regular saving, even small amounts, builds a strong financial foundation.",
        points: 10,
      },
      {
        question: "How long should an emergency fund typically cover?",
        options: ["1 week", "1 month", "3-6 months of expenses", "1 year"],
        correctAnswer: 2,
        explanation: "Most financial experts recommend saving 3-6 months of expenses for emergencies.",
        points: 10,
      },
    ],
    "Understanding Interest": [
      {
        question: "What is simple interest?",
        options: [
          "Interest calculated only on the principal amount",
          "Interest calculated on principal plus accumulated interest",
          "Interest that changes daily",
          "Interest paid to the government",
        ],
        correctAnswer: 0,
        explanation: "Simple interest is calculated only on the original principal amount.",
        points: 10,
      },
      {
        question: "Which type of interest grows faster?",
        options: [
          "Simple interest",
          "Compound interest",
          "They grow at the same rate",
          "Fixed interest",
        ],
        correctAnswer: 1,
        explanation: "Compound interest grows faster because interest is earned on both the principal and accumulated interest.",
        points: 10,
      },
      {
        question: "If you deposit ₹1000 at 5% annual simple interest for 2 years, how much interest do you earn?",
        options: ["₹50", "₹100", "₹105", "₹110"],
        correctAnswer: 1,
        explanation: "Simple interest = Principal × Rate × Time = 1000 × 0.05 × 2 = ₹100",
        points: 10,
      },
    ],
    "Loans and EMI Explained": [
      {
        question: "What does EMI stand for?",
        options: [
          "Equal Monthly Income",
          "Equated Monthly Installment",
          "Electronic Money Transfer",
          "Every Month Interest",
        ],
        correctAnswer: 1,
        explanation: "EMI stands for Equated Monthly Installment, a fixed payment made monthly to repay a loan.",
        points: 10,
      },
      {
        question: "Which factor does NOT affect EMI calculation?",
        options: ["Loan amount", "Interest rate", "Tenure", "Your hobbies"],
        correctAnswer: 3,
        explanation: "Your personal hobbies have no bearing on EMI calculation. Only loan amount, interest rate, and tenure matter.",
        points: 10,
      },
      {
        question: "What happens if you pay off a loan early?",
        options: [
          "You pay the same amount",
          "You pay more interest",
          "You typically pay less total interest",
          "The bank cancels the loan",
        ],
        correctAnswer: 2,
        explanation: "Paying off a loan early reduces the total interest you pay because interest accrues over a shorter period.",
        points: 10,
      },
    ],
    "Credit Cards: Benefits and Risks": [
      {
        question: "What is a credit limit?",
        options: [
          "The amount you can borrow using the credit card",
          "The amount you must spend each month",
          "The fee for using the card",
          "The interest rate charged",
        ],
        correctAnswer: 0,
        explanation: "A credit limit is the maximum amount of credit the card issuer allows you to borrow.",
        points: 10,
      },
      {
        question: "What happens if you don't pay your credit card bill on time?",
        options: [
          "Nothing, it's automatically forgiven",
          "You face late fees and interest charges",
          "Your card is upgraded",
          "You earn bonus rewards",
        ],
        correctAnswer: 1,
        explanation: "Late payments result in additional charges and higher interest rates.",
        points: 10,
      },
      {
        question: "What is a credit score primarily based on?",
        options: [
          "Your salary",
          "Your age",
          "Your payment history and credit usage",
          "Your hobbies",
        ],
        correctAnswer: 2,
        explanation: "Credit scores are primarily determined by payment history, credit utilization, and other borrowing patterns.",
        points: 10,
      },
    ],
  };

  return questionsMap[lessonTitle] || [];
}
