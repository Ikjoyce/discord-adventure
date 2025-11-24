import { EmbedBuilder } from 'discord.js';

const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const MAX_CALLS = 5;

// Map<userId, timestamps[]>
const userCalls = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
}

export function checkRateLimit(userId: string, isAdmin: boolean = false): RateLimitResult {
  if (isAdmin) {
    return { allowed: true, remaining: 999, resetIn: 0 };
  }

  const now = Date.now();
  const timestamps = userCalls.get(userId) || [];
  
  // Filter out old timestamps
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  // Update map if we filtered anything
  if (validTimestamps.length !== timestamps.length) {
    userCalls.set(userId, validTimestamps);
  }

  if (validTimestamps.length >= MAX_CALLS) {
    const oldestCall = validTimestamps[0];
    const resetIn = Math.ceil((oldestCall + RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  return { 
    allowed: true, 
    remaining: MAX_CALLS - validTimestamps.length, 
    resetIn: 0 
  };
}

export function recordCall(userId: string, isAdmin: boolean = false): void {
  if (isAdmin) return;

  const now = Date.now();
  const timestamps = userCalls.get(userId) || [];
  timestamps.push(now);
  userCalls.set(userId, timestamps);
}

export function clearUserLimit(userId: string): void {
  userCalls.delete(userId);
}

export function getUserStatus(userId: string): { calls: number, oldestCall: number } {
  const timestamps = userCalls.get(userId) || [];
  return {
    calls: timestamps.length,
    oldestCall: timestamps.length > 0 ? timestamps[0] : 0
  };
}

export function getAllRateLimits(): Map<string, number> {
  const result = new Map<string, number>();
  for (const [userId, timestamps] of userCalls.entries()) {
    result.set(userId, timestamps.length);
  }
  return result;
}

// Cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of userCalls.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (validTimestamps.length === 0) {
      userCalls.delete(userId);
    } else {
      userCalls.set(userId, validTimestamps);
    }
  }
}, 30000); // Every 30 seconds

export function createRateLimitEmbed(resetIn: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('⏱️ Rate Limit Exceeded')
    .setDescription(`You are rolling too fast! The DM needs a moment to think.\n\nYou can make more rolls in **${resetIn} seconds**.`);
}