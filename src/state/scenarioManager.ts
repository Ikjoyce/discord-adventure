export interface Scenario {
  channelId: string;
  description: string;
  suggestedActions: string[];
  createdAt: number;
  expiresAt: number;
  active: boolean;
  messageIds: string[];
}

const activeScenarios: Map<string, Scenario> = new Map();
export const SCENARIO_TIMEOUT = 60 * 60 * 1000; // 1 hour

export function createScenario(channelId: string, description: string, suggestedActions: string[]): Scenario {
  const now = Date.now();
  const scenario: Scenario = {
    channelId,
    description,
    suggestedActions,
    createdAt: now,
    expiresAt: now + SCENARIO_TIMEOUT,
    active: true,
    messageIds: []
  };
  
  activeScenarios.set(channelId, scenario);
  return scenario;
}

export function addScenarioMessage(channelId: string, messageId: string): void {
  const scenario = activeScenarios.get(channelId);
  if (scenario) {
    scenario.messageIds.push(messageId);
  }
}

export function getScenario(channelId: string): Scenario | undefined {
  const scenario = activeScenarios.get(channelId);
  
  if (scenario && Date.now() - scenario.createdAt > SCENARIO_TIMEOUT) {
    // Scenario expired
    activeScenarios.delete(channelId);
    return undefined;
  }
  
  return scenario;
}

export function endScenario(channelId: string): boolean {
  return activeScenarios.delete(channelId);
}

export function hasActiveScenario(channelId: string): boolean {
  const scenario = getScenario(channelId);
  return scenario !== undefined && scenario.active;
}

// Cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [id, scenario] of activeScenarios.entries()) {
    if (now - scenario.createdAt > SCENARIO_TIMEOUT) {
      activeScenarios.delete(id);
    }
  }
}, SCENARIO_TIMEOUT);
