"use client";

import { Badge } from "@/components/ui/badge";
import type { AutoContinueConfig, DebateConfig } from "@/features/debate/types";
import { cn } from "@/lib/utils";

interface DebateHeaderProps {
  leftConfig: DebateConfig;
  rightConfig: DebateConfig;
  autoContinue: AutoContinueConfig;
  isLeftStreaming: boolean;
  isRightStreaming: boolean;
}

export function DebateHeader({
  leftConfig,
  rightConfig,
  autoContinue,
  isLeftStreaming,
  isRightStreaming,
}: DebateHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">
          {leftConfig.label} vs {rightConfig.label}
        </h1>
        {autoContinue.enabled && (
          <Badge variant="secondary" className="text-xs">
            Round {autoContinue.currentRound} / {autoContinue.maxRounds}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "size-2 rounded-full",
                isLeftStreaming ? "bg-blue-500 animate-pulse" : "bg-muted-foreground/20",
              )}
            />
            <span>Left</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "size-2 rounded-full",
                isRightStreaming ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/20",
              )}
            />
            <span>Right</span>
          </div>
        </div>
      </div>
    </header>
  );
}
