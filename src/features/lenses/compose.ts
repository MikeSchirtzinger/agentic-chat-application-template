import { SYSTEM_PROMPT } from "../chat/constants";
import type { Lens } from "./types";

export function composeLensPrompt(lenses: Lens[]): string {
  if (lenses.length === 0) {
    return SYSTEM_PROMPT;
  }

  if (lenses.length === 1) {
    const lens = lenses[0];
    if (!lens) {
      return SYSTEM_PROMPT;
    }
    return `${SYSTEM_PROMPT}\n\n## Active Mindset: ${lens.name}\n${lens.prompt}`;
  }

  const lensInstructions = lenses.map((l, i) => `${i + 1}. **${l.name}**: ${l.prompt}`).join("\n");

  return `${SYSTEM_PROMPT}\n\n## Active Mindsets\nApply ALL of the following cognitive lenses simultaneously. Synthesize their perspectives into a coherent response:\n\n${lensInstructions}\n\nIntegrate these perspectives naturally — don't just list each viewpoint separately.`;
}
