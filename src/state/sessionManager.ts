interface Session {
  channelId: string;
  history: string[];
  lastActivity: number;
}

const sessions: Map<string, Session> = new Map();
const MAX_HISTORY = 10;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function getSession(channelId: string): Session {
  const now = Date.now();
  
  if (!sessions.has(channelId)) {
    sessions.set(channelId, {
      channelId,
      history: [],
      lastActivity: now
    });
  }
  
  const session = sessions.get(channelId)!;
  
  // Check timeout
  if (now - session.lastActivity > SESSION_TIMEOUT) {
    session.history = []; // Reset history on timeout
  }
  
  session.lastActivity = now;
  return session;
}

export function addToHistory(channelId: string, entry: string) {
  const session = getSession(channelId);
  session.history.push(entry);
  
  if (session.history.length > MAX_HISTORY) {
    session.history.shift(); // Keep only last N entries
  }
}

export function getHistory(channelId: string): string[] {
  return getSession(channelId).history;
}

export function clearSession(channelId: string) {
  sessions.delete(channelId);
}

// Cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT * 2) {
      sessions.delete(id);
    }
  }
}, SESSION_TIMEOUT);