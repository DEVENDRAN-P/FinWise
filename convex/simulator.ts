import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Calculate EMI and loan details
export const calculateLoan = query({
  args: {
    loanAmount: v.number(),
    interestRate: v.number(),
    tenure: v.number(), // in months
  },
  handler: async (ctx, args) => {
    const { loanAmount, interestRate, tenure } = args;
    
    // Convert annual interest rate to monthly
    const monthlyRate = interestRate / (12 * 100);
    
    // Calculate EMI using formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = monthlyRate === 0 
      ? loanAmount / tenure 
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
        (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalAmount = emi * tenure;
    const totalInterest = totalAmount - loanAmount;
    
    // Generate amortization schedule (first 12 months)
    const schedule = [];
    let remainingPrincipal = loanAmount;
    
    for (let month = 1; month <= Math.min(12, tenure); month++) {
      const interestPayment = remainingPrincipal * monthlyRate;
      const principalPayment = emi - interestPayment;
      remainingPrincipal -= principalPayment;
      
      schedule.push({
        month,
        emi: Math.round(emi),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(Math.max(0, remainingPrincipal)),
      });
    }
    
    return {
      emiAmount: Math.round(emi),
      totalAmount: Math.round(totalAmount),
      totalInterest: Math.round(totalInterest),
      schedule,
      monthlyRate: monthlyRate * 100,
    };
  },
});

// Save loan simulation
export const saveLoanSimulation = mutation({
  args: {
    loanAmount: v.number(),
    interestRate: v.number(),
    tenure: v.number(),
    emiAmount: v.number(),
    totalInterest: v.number(),
    totalAmount: v.number(),
    simulationType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const simulationId = await ctx.db.insert("loanSimulations", {
      userId,
      loanAmount: args.loanAmount,
      interestRate: args.interestRate,
      tenure: args.tenure,
      emiAmount: args.emiAmount,
      totalInterest: args.totalInterest,
      totalAmount: args.totalAmount,
      simulationType: args.simulationType,
      createdAt: Date.now(),
    });

    // Award coins for using simulator
    let userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        totalCoins: userProfile.totalCoins + 25, // 25 coins for simulation
      });
    }

    return simulationId;
  },
});

// Get user's loan simulations
export const getUserSimulations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("loanSimulations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});

// Compare loan options
export const compareLoanOptions = query({
  args: {
    loanAmount: v.number(),
    options: v.array(v.object({
      name: v.string(),
      interestRate: v.number(),
      tenure: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { loanAmount, options } = args;
    
    return options.map(option => {
      const monthlyRate = option.interestRate / (12 * 100);
      const emi = monthlyRate === 0 
        ? loanAmount / option.tenure 
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, option.tenure)) / 
          (Math.pow(1 + monthlyRate, option.tenure) - 1);
      
      const totalAmount = emi * option.tenure;
      const totalInterest = totalAmount - loanAmount;
      
      return {
        ...option,
        emiAmount: Math.round(emi),
        totalAmount: Math.round(totalAmount),
        totalInterest: Math.round(totalInterest),
        savings: 0, // Will be calculated relative to most expensive option
      };
    }).map((option, index, array) => {
      const maxTotal = Math.max(...array.map(o => o.totalAmount));
      return {
        ...option,
        savings: maxTotal - option.totalAmount,
      };
    });
  },
});
