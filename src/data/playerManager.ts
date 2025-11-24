import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

export interface PlayerStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface PlayerData {
  userId: string;
  characterName: string;
  stats: PlayerStats;
  modifiers: PlayerStats;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_STATS: PlayerStats = {
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
};

// In-memory cache
let playersCache: Map<string, PlayerData> = new Map();
let isLoaded = false;

function calculateModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

function calculateModifiers(stats: PlayerStats): PlayerStats {
  return {
    str: calculateModifier(stats.str),
    dex: calculateModifier(stats.dex),
    con: calculateModifier(stats.con),
    int: calculateModifier(stats.int),
    wis: calculateModifier(stats.wis),
    cha: calculateModifier(stats.cha)
  };
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

export function loadPlayers(): void {
  ensureDirectories();
  
  if (fs.existsSync(PLAYERS_FILE)) {
    try {
      const data = fs.readFileSync(PLAYERS_FILE, 'utf-8');
      const players = JSON.parse(data) as PlayerData[];
      playersCache = new Map(players.map(p => [p.userId, p]));
    } catch (error) {
      console.error('Error loading players.json:', error);
      // If error, start with empty cache but don't overwrite file yet
      playersCache = new Map();
    }
  } else {
    playersCache = new Map();
  }
  isLoaded = true;
}

function createBackup() {
  if (!fs.existsSync(PLAYERS_FILE)) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUPS_DIR, `players_${timestamp}.json`);
  
  try {
    fs.copyFileSync(PLAYERS_FILE, backupFile);
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

export function savePlayers(): void {
  ensureDirectories();
  createBackup();
  
  const playersArray = Array.from(playersCache.values());
  try {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(playersArray, null, 2));
  } catch (error) {
    console.error('Error saving players.json:', error);
  }
}

export function getPlayer(userId: string, username: string): PlayerData {
  if (!isLoaded) loadPlayers();
  
  if (!playersCache.has(userId)) {
    // Create new player
    const newPlayer: PlayerData = {
      userId,
      characterName: username, // Default to Discord username
      stats: { ...DEFAULT_STATS },
      modifiers: calculateModifiers(DEFAULT_STATS),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    playersCache.set(userId, newPlayer);
    savePlayers();
  }
  
  return playersCache.get(userId)!;
}

export function updatePlayerStats(userId: string, stats: Partial<PlayerStats>): PlayerData | null {
  if (!isLoaded) loadPlayers();
  
  const player = playersCache.get(userId);
  if (!player) return null;
  
  const newStats = { ...player.stats, ...stats };
  
  // Validate stats (1-30)
  for (const key of Object.keys(newStats) as Array<keyof PlayerStats>) {
    newStats[key] = Math.max(1, Math.min(30, newStats[key]));
  }
  
  player.stats = newStats;
  player.modifiers = calculateModifiers(newStats);
  player.updatedAt = new Date().toISOString();
  
  playersCache.set(userId, player);
  savePlayers();
  
  return player;
}

export function listBackups(): string[] {
  ensureDirectories();
  try {
    return fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
  } catch (error) {
    return [];
  }
}

export function triggerManualBackup(): string {
  createBackup();
  return `Backup created at ${new Date().toISOString()}`;
}