# Plan: o-debate-phase4-20260213

## Objective
Build Phase 4: Multi-User Debate — split-screen with two AI perspectives arguing from different mindsets. Two independent message streams with per-side lens configs, parallel API calls, and optional auto-continue rounds.

## Team Members
| Name | Role | Agent Type | Model | Tasks |
|------|------|-----------|-------|-------|
| types-architect | Define shared debate contracts | architect | sonnet | 1 |
| hook-engineer | Implement use-debate.ts hook | engineer | sonnet | 2 |
| ui-engineer | Build debate UI components | engineer | sonnet | 3 |
| integration-engineer | Wire everything together | engineer | sonnet | 4, 5 |
| validator | Validate build + lint + types | validator | haiku | 6 |

## Existing Architecture (Context for All Agents)

### Key Files to READ (do not modify unless specified)
- `src/features/chat/schemas.ts` — SendMessageSchema with activeLensIds
- `src/features/chat/stream.ts` — streamChatCompletion with systemPrompt param
- `src/features/chat/service.ts` — createConversation, addMessage, getMessages
- `src/features/chat/constants.ts` — SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES
- `src/features/lenses/types.ts` — PresetLens, CustomLens, Lens types
- `src/features/lenses/compose.ts` — composeLensPrompt function
- `src/features/lenses/constants.ts` — PRESET_LENSES array
- `src/hooks/use-chat.ts` — Current chat hook (reference for debate hook)
- `src/hooks/use-lenses.ts` — Current lens hook (reference for per-side lens management)
- `src/components/chat/chat-layout.tsx` — Current layout (will be modified in Phase 2)
- `src/components/chat/message-list.tsx` — Reusable MessageList component
- `src/components/chat/chat-input.tsx` — Reusable ChatInput component
- `src/components/chat/chat-header.tsx` — ChatHeader (mode toggle added here)
- `src/app/page.tsx` — Root page (mode toggle wired here)
- `src/app/api/chat/send/route.ts` — API endpoint (no changes needed)

### Tech Stack
- Next.js 16, React 19, TypeScript strict mode
- Tailwind CSS 4, shadcn/ui components
- Zod v4 (import from "zod/v4")
- Biome linting, Bun test runner
- Path aliases: @/* maps to ./src/*

### Code Style Rules
- Named exports (no default exports except Next.js pages/layouts)
- `type` keyword on type-only imports/exports
- `const` over `let`, `for...of` over `.forEach()`
- 2-space indent, 100 char line width, double quotes
- Structured logging: `getLogger("domain.component")`

### Self-Correction
After writing code, run: `bun run lint && npx tsc --noEmit`
Fix all errors before marking task complete.

---

## Tasks

### Task 1: Define shared debate types and contracts
- **ID**: define-types
- **Phase**: 0 (blocking)
- **Dependencies**: none
- **Owner**: types-architect
- **Scope**:
  - READ: src/features/chat/models.ts, src/features/lenses/types.ts, src/hooks/use-chat.ts
  - WRITE: src/features/debate/types.ts, src/features/debate/index.ts
  - FORBIDDEN: src/app/, src/components/, src/hooks/
- **Acceptance Criteria**:
  1. File `src/features/debate/types.ts` exists with these exports:
     - `DebateSide` — literal union `"left" | "right"`
     - `DebateConfig` — per-side config: `{ side: DebateSide; lensIds: string[]; label: string }`
     - `DebateMessage` — extends chat message concept: `{ id: string; side: DebateSide; role: "user" | "assistant"; content: string; createdAt: string }`
     - `DebateRound` — `{ roundNumber: number; userPrompt: string; leftResponse: string; rightResponse: string }`
     - `AutoContinueConfig` — `{ enabled: boolean; maxRounds: number; currentRound: number }`
     - `DebateState` — full state shape: `{ leftMessages: DebateMessage[]; rightMessages: DebateMessage[]; leftConfig: DebateConfig; rightConfig: DebateConfig; isLeftStreaming: boolean; isRightStreaming: boolean; leftStreamingContent: string; rightStreamingContent: string; autoContinue: AutoContinueConfig; leftConversationId: string | null; rightConversationId: string | null }`
     - `UseDebateReturn` — hook return type including state + actions: `{ state: DebateState; sendDebateMessage: (content: string) => Promise<void>; updateSideConfig: (side: DebateSide, config: Partial<DebateConfig>) => void; toggleAutoContinue: () => void; setMaxRounds: (n: number) => void; resetDebate: () => void; stopAutoContinue: () => void; isAnyStreaming: boolean }`
  2. File `src/features/debate/index.ts` re-exports all types from types.ts
  3. `npx tsc --noEmit` passes

### Task 2: Implement use-debate.ts hook
- **ID**: impl-hook
- **Phase**: 1
- **Dependencies**: define-types
- **Owner**: hook-engineer
- **Scope**:
  - READ: src/features/debate/types.ts, src/hooks/use-chat.ts, src/hooks/use-lenses.ts, src/features/chat/schemas.ts, src/app/api/chat/send/route.ts
  - WRITE: src/hooks/use-debate.ts
  - FORBIDDEN: src/components/, src/app/, src/features/chat/, src/features/lenses/
- **Acceptance Criteria**:
  1. File `src/hooks/use-debate.ts` exists
  2. Exports `useDebate()` hook returning `UseDebateReturn`
  3. `sendDebateMessage(content)`:
     - Fires TWO parallel `POST /api/chat/send` requests
     - Left side sends with `leftConfig.lensIds`, right side with `rightConfig.lensIds`
     - Each side uses its own `conversationId` (creates new conversations on first message)
     - Reads SSE streams independently, updating per-side streaming state
     - On completion, saves messages to per-side arrays
  4. Auto-continue logic:
     - When both sides complete AND `autoContinue.enabled` AND `currentRound < maxRounds`:
     - Feeds left's response as next user input to right side
     - Feeds right's response as next user input to left side
     - Increments round counter
     - `stopAutoContinue()` aborts mid-auto-continue
  5. `updateSideConfig(side, partial)` updates lens IDs and label for a side
  6. `resetDebate()` clears all state, creates fresh conversation IDs
  7. Proper cleanup: abort controllers on unmount
  8. `bun run lint && npx tsc --noEmit` passes

### Task 3: Build debate UI components
- **ID**: impl-ui
- **Phase**: 1
- **Dependencies**: define-types
- **Owner**: ui-engineer
- **Scope**:
  - READ: src/features/debate/types.ts, src/components/chat/message-list.tsx, src/components/chat/chat-input.tsx, src/components/chat/chat-header.tsx, src/components/chat/message-bubble.tsx, src/components/lenses/lens-selector.tsx, src/lib/utils.ts
  - WRITE: src/components/debate/debate-layout.tsx, src/components/debate/debate-panel.tsx, src/components/debate/debate-header.tsx, src/components/debate/debate-controls.tsx
  - FORBIDDEN: src/hooks/, src/features/, src/app/
- **Acceptance Criteria**:
  1. `debate-layout.tsx`:
     - Accepts `UseDebateReturn` as props (or a subset of it)
     - Renders split-screen layout: two panels side by side (flex row on desktop, stacked on mobile)
     - Each panel contains a `MessageList` for that side's messages + streaming content
     - Shared `ChatInput` at the bottom spanning full width
     - Calls `sendDebateMessage` when user submits input
  2. `debate-panel.tsx`:
     - Single side panel showing messages + streaming content for one side
     - Displays side label and active lens names at top
     - Visual distinction between left/right (subtle background tint or border color)
     - Reuses existing `MessageBubble` or `MessageList` for rendering
  3. `debate-header.tsx`:
     - Shows debate status (round counter, streaming indicator per side)
     - Per-side lens display (which lenses are active on each side)
  4. `debate-controls.tsx`:
     - Auto-continue toggle (switch or checkbox)
     - Max rounds input (number, 1-10 range)
     - Stop button (visible during auto-continue)
     - Reset debate button
  5. All components use shadcn/ui primitives and Tailwind CSS 4
  6. `bun run lint && npx tsc --noEmit` passes
  7. Components accept typed props — no `any` types

### Task 4: Integrate debate into main page with mode toggle
- **ID**: integration
- **Phase**: 2
- **Dependencies**: impl-hook, impl-ui
- **Owner**: integration-engineer
- **Scope**:
  - READ: ALL src/ files
  - WRITE: src/app/page.tsx, src/components/chat/chat-layout.tsx, src/components/chat/chat-header.tsx, src/components/debate/debate-layout.tsx (minor fixes only)
  - FORBIDDEN: src/features/chat/ (no backend changes)
- **Acceptance Criteria**:
  1. `ChatHeader` has a mode toggle: "Chat" | "Debate" (can be a segmented control or tabs)
  2. `page.tsx` or `ChatLayout` conditionally renders:
     - Chat mode → existing ChatLayout behavior
     - Debate mode → DebateLayout with useDebate() hook
  3. Mode toggle state persisted (localStorage or URL param)
  4. In debate mode, LensSelector works per-side:
     - User clicks a side panel → that side becomes "active" for lens assignment
     - Toggling a lens applies to the active side
  5. Auto-continue controls visible in debate mode
  6. Smooth transition between modes (no layout jump)
  7. `bun run lint && npx tsc --noEmit` passes

### Task 5: Polish and auto-continue UX
- **ID**: polish
- **Phase**: 2
- **Dependencies**: impl-hook, impl-ui
- **Owner**: integration-engineer
- **Scope**:
  - READ: ALL src/ files
  - WRITE: src/hooks/use-debate.ts (bug fixes), src/components/debate/* (polish)
  - FORBIDDEN: src/features/chat/ (no backend changes)
- **Acceptance Criteria**:
  1. Auto-continue rounds display a round counter badge
  2. During auto-continue, both panels show streaming simultaneously
  3. Stop button immediately halts auto-continue mid-stream
  4. Error handling: if one side fails, the other still completes + error toast
  5. Empty state in debate mode shows instructions
  6. `bun run lint && npx tsc --noEmit` passes

### Task 6: Final validation
- **ID**: validate
- **Phase**: 3
- **Dependencies**: integration, polish
- **Owner**: validator
- **Acceptance Criteria**:
  1. `bun run lint` passes with no errors
  2. `npx tsc --noEmit` passes with no errors
  3. `bun run build` succeeds
  4. All new files exist and are non-empty
  5. No `any` types, no TODO/FIXME comments
  6. No console.log statements
  7. All imports resolve

## Relevant Files (Summary)
### New Files (created by this plan)
- src/features/debate/types.ts (Phase 0)
- src/features/debate/index.ts (Phase 0)
- src/hooks/use-debate.ts (Phase 1)
- src/components/debate/debate-layout.tsx (Phase 1)
- src/components/debate/debate-panel.tsx (Phase 1)
- src/components/debate/debate-header.tsx (Phase 1)
- src/components/debate/debate-controls.tsx (Phase 1)

### Modified Files
- src/app/page.tsx (Phase 2)
- src/components/chat/chat-layout.tsx (Phase 2)
- src/components/chat/chat-header.tsx (Phase 2)
