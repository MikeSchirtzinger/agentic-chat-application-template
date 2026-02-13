/**
 * Debate feature types and contracts
 *
 * Defines the type system for multi-user debate mode where two AI perspectives
 * argue from different mindsets using independent message streams and lens configs.
 */

/**
 * Debate side identifier
 */
export type DebateSide = "left" | "right";

/**
 * Per-side configuration for debate
 */
export interface DebateConfig {
  side: DebateSide;
  lensIds: string[];
  label: string;
}

/**
 * Message in a debate stream
 * Extends the chat message concept with side awareness
 */
export interface DebateMessage {
  id: string;
  side: DebateSide;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/**
 * Single round of debate exchanges
 */
export interface DebateRound {
  roundNumber: number;
  userPrompt: string;
  leftResponse: string;
  rightResponse: string;
}

/**
 * Auto-continue configuration for multi-round debates
 */
export interface AutoContinueConfig {
  enabled: boolean;
  maxRounds: number;
  currentRound: number;
}

/**
 * Complete debate state
 */
export interface DebateState {
  leftMessages: DebateMessage[];
  rightMessages: DebateMessage[];
  leftConfig: DebateConfig;
  rightConfig: DebateConfig;
  isLeftStreaming: boolean;
  isRightStreaming: boolean;
  leftStreamingContent: string;
  rightStreamingContent: string;
  autoContinue: AutoContinueConfig;
  leftConversationId: string | null;
  rightConversationId: string | null;
}

/**
 * Hook return type for useDebate
 */
export interface UseDebateReturn {
  state: DebateState;
  sendDebateMessage: (content: string) => Promise<void>;
  updateSideConfig: (side: DebateSide, config: Partial<DebateConfig>) => void;
  toggleAutoContinue: () => void;
  setMaxRounds: (n: number) => void;
  resetDebate: () => void;
  stopAutoContinue: () => void;
  isAnyStreaming: boolean;
}
