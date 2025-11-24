import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PlayerData } from '../data/playerManager';
import { RollResult } from '../utils/dice';

let genAI: GoogleGenerativeAI;
let model: GenerativeModel;

export function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-preview-02-05' });
}

interface NarrativeContext {
  player: PlayerData;
  action: string;
  roll: RollResult;
  statUsed: string;
  difficultyClass?: number; // Optional DC
  history?: string[]; // Previous context
}

export async function generateNarrative(context: NarrativeContext): Promise<string> {
  if (!model) initGemini();

  const { player, action, roll, statUsed, difficultyClass } = context;
  
  // Determine success/failure if DC is provided, otherwise leave it open-ended or based on standard tiers
  let outcomeHint = '';
  if (difficultyClass) {
    outcomeHint = roll.total >= difficultyClass ? 'SUCCESS' : 'FAILURE';
  } else {
    // General guidance for the AI if no DC is set
    if (roll.total < 5) outcomeHint = 'CRITICAL FAILURE / VERY BAD OUTCOME';
    else if (roll.total < 10) outcomeHint = 'FAILURE / POOR OUTCOME';
    else if (roll.total < 15) outcomeHint = 'MIXED SUCCESS / AVERAGE OUTCOME';
    else if (roll.total < 20) outcomeHint = 'SUCCESS / GOOD OUTCOME';
    else outcomeHint = 'CRITICAL SUCCESS / AMAZING OUTCOME';
  }

  if (roll.isCriticalSuccess) outcomeHint = 'CRITICAL SUCCESS! THE BEST POSSIBLE RESULT.';
  if (roll.isCriticalFailure) outcomeHint = 'CRITICAL FAILURE! A CATASTROPHIC MISHAP.';

  const prompt = `
    You are the Dungeon Master for a Dungeons & Dragons 5e game.
    
    Player: ${player.characterName}
    Stats: STR:${player.stats.str} DEX:${player.stats.dex} CON:${player.stats.con} INT:${player.stats.int} WIS:${player.stats.wis} CHA:${player.stats.cha}
    
    The player attempts to: "${action}"
    Stat used: ${statUsed}
    Dice Roll: ${roll.total} (Natural: ${roll.naturalRoll}, Modifier: ${roll.modifier})
    Outcome Guidance: ${outcomeHint}

    Describe the result of this action in a vivid, immersive, and concise way (max 3 sentences). 
    Focus on the immediate consequences. 
    If it was a failure, describe how it went wrong. 
    If it was a success, describe the heroic feat.
    Do not include game mechanics numbers in the narrative, just the story.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "The mists of the multiverse obscure the outcome... (AI Error)";
  }
}

export async function generateChatResponse(history: string[], newMessage: string): Promise<string> {
    if (!model) initGemini();

    const prompt = `
    You are a helpful and creative Dungeon Master assistant.
    
    Conversation History:
    ${history.join('\n')}
    
    User: ${newMessage}
    
    Respond as a DM would, keeping it brief and helpful.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini Chat Error:', error);
        return "I cannot speak right now. (AI Error)";
    }
}