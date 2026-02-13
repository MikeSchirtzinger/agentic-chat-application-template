"use client";

import { Swords } from "lucide-react";
import { useCallback, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { CustomLensBuilder } from "@/components/lenses/custom-lens-builder";
import type { DebateSide, UseDebateReturn } from "@/features/debate/types";
import type { CustomLens } from "@/features/lenses/types";
import { useLenses } from "@/hooks/use-lenses";

import { DebateControls } from "./debate-controls";
import { DebateHeader } from "./debate-header";
import { DebateLensSelector } from "./debate-lens-selector";
import { DebatePanel } from "./debate-panel";

interface DebateLayoutProps {
  debate: UseDebateReturn;
}

export function DebateLayout({ debate }: DebateLayoutProps) {
  const {
    state,
    sendDebateMessage,
    updateSideConfig,
    toggleAutoContinue,
    setMaxRounds,
    stopAutoContinue,
    resetDebate,
    isAnyStreaming,
  } = debate;

  const { allLenses, addCustomLens } = useLenses(null);
  const [activeSide, setActiveSide] = useState<DebateSide | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const handleSend = async (content: string) => {
    await sendDebateMessage(content);
  };

  const handleToggleLens = useCallback(
    (id: string) => {
      if (!activeSide) {
        return;
      }
      const config = activeSide === "left" ? state.leftConfig : state.rightConfig;
      const newLensIds = config.lensIds.includes(id)
        ? config.lensIds.filter((x) => x !== id)
        : config.lensIds.length >= 5
          ? config.lensIds
          : [...config.lensIds, id];
      updateSideConfig(activeSide, { lensIds: newLensIds });
    },
    [activeSide, state.leftConfig, state.rightConfig, updateSideConfig],
  );

  const handleLensCreated = useCallback(
    (lens: CustomLens) => {
      addCustomLens(lens);
      if (activeSide) {
        const config = activeSide === "left" ? state.leftConfig : state.rightConfig;
        if (config.lensIds.length < 5) {
          updateSideConfig(activeSide, { lensIds: [...config.lensIds, lens.id] });
        }
      }
    },
    [activeSide, addCustomLens, state.leftConfig, state.rightConfig, updateSideConfig],
  );

  const hasAnyMessages = state.leftMessages.length > 0 || state.rightMessages.length > 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {hasAnyMessages ? (
        <>
          <DebateHeader
            leftConfig={state.leftConfig}
            rightConfig={state.rightConfig}
            autoContinue={state.autoContinue}
            isLeftStreaming={state.isLeftStreaming}
            isRightStreaming={state.isRightStreaming}
          />

          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            <DebatePanel
              side="left"
              messages={state.leftMessages}
              streamingContent={state.leftStreamingContent}
              isStreaming={state.isLeftStreaming}
              config={state.leftConfig}
              isActive={activeSide === "left"}
              onActivate={() => setActiveSide("left")}
            />
            <DebatePanel
              side="right"
              messages={state.rightMessages}
              streamingContent={state.rightStreamingContent}
              isStreaming={state.isRightStreaming}
              config={state.rightConfig}
              isActive={activeSide === "right"}
              onActivate={() => setActiveSide("right")}
            />
          </div>

          <DebateControls
            autoContinue={state.autoContinue}
            onToggle={toggleAutoContinue}
            onSetMaxRounds={setMaxRounds}
            onStop={stopAutoContinue}
            onReset={resetDebate}
            isAnyStreaming={isAnyStreaming}
          />

          <DebateLensSelector
            lenses={allLenses}
            activeSide={activeSide}
            leftLensIds={state.leftConfig.lensIds}
            rightLensIds={state.rightConfig.lensIds}
            onToggleLens={handleToggleLens}
            onOpenBuilder={() => setIsBuilderOpen(true)}
          />

          <ChatInput onSend={handleSend} disabled={isAnyStreaming} />
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
            <div className="bg-primary/10 flex size-20 items-center justify-center rounded-2xl">
              <Swords className="text-primary size-10" />
            </div>
            <div className="max-w-lg text-center">
              <h2 className="text-2xl font-semibold">Start a Debate</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Type a topic below to see two AI perspectives argue different viewpoints. Assign
                lenses to each side for contrasting mindsets.
              </p>
              <div className="text-muted-foreground mt-4 space-y-1 text-xs">
                <p>Click a panel to select it, then toggle lenses for that side.</p>
                <p>Enable auto-continue for multi-round debates.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 px-4 py-3">
            <div className="flex items-center justify-center gap-8">
              <button
                type="button"
                onClick={() => setActiveSide("left")}
                className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm transition-all ${
                  activeSide === "left"
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-border hover:border-blue-500/50"
                }`}
              >
                <div className="size-3 rounded-full bg-blue-500" />
                Left Side ({state.leftConfig.lensIds.length} lenses)
              </button>
              <button
                type="button"
                onClick={() => setActiveSide("right")}
                className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm transition-all ${
                  activeSide === "right"
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-border hover:border-amber-500/50"
                }`}
              >
                <div className="size-3 rounded-full bg-amber-500" />
                Right Side ({state.rightConfig.lensIds.length} lenses)
              </button>
            </div>
          </div>

          <DebateLensSelector
            lenses={allLenses}
            activeSide={activeSide}
            leftLensIds={state.leftConfig.lensIds}
            rightLensIds={state.rightConfig.lensIds}
            onToggleLens={handleToggleLens}
            onOpenBuilder={() => setIsBuilderOpen(true)}
          />

          <ChatInput onSend={handleSend} disabled={isAnyStreaming} />
        </>
      )}

      <CustomLensBuilder
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        onLensCreated={handleLensCreated}
      />
    </div>
  );
}
