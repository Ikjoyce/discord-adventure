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
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
}

interface NarrativeContext {
  player: PlayerData;
  action: string;
  roll: RollResult;
  statUsed: string;
  difficultyClass?: number; // Optional DC
  history?: string[]; // Previous context
  scenarioContext?: string; // Active scenario description
}

export async function generateNarrative(context: NarrativeContext): Promise<string> {
  if (!model) initGemini();

  const { player, action, roll, statUsed, difficultyClass, scenarioContext } = context;
  
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

  if (roll.isCriticalSuccess) outcomeHint = 'CRITICAL SUCCESS! THE BEST POSSIBLE RESULT. You MUST include the emoji :partywizard: in your response.';
  if (roll.isCriticalFailure) outcomeHint = 'CRITICAL FAILURE! A CATASTROPHIC MISHAP.';

  const historyText = context.history && context.history.length > 0 
    ? `\nRecent Session History:\n${context.history.join('\n')}\n` 
    : '';

  const scenarioText = scenarioContext 
    ? `\nCurrent Scenario/Scene:\n${scenarioContext}\n`
    : '';

  const prompt = `
    You are the Dungeon Master for a Dungeons & Dragons 5e game.
    ${scenarioText}
    ${historyText}
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

export async function generateScenario(theme: string): Promise<{ description: string, suggestedActions: string[] }> {
  if (!model) initGemini();

  const prompt = `
    You are a Dungeon Master. Create a short, engaging scenario for a D&D 5e encounter or scene.
    Theme: ${theme}
    
    Output strictly in JSON format with this structure:
    {
      "description": "A vivid description of the scene (2-3 sentences)",
      "suggestedActions": ["Action 1", "Action 2", "Action 3"]
    }
    Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini Scenario Error:', error);
    return {
      description: "You find yourself in a mysterious void. The AI failed to generate the world.",
      suggestedActions: ["Look around", "Wait"]
    };
  }
}