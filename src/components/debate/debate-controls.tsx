"use client";

import { Minus, Plus, RotateCcw, StopCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AutoContinueConfig } from "@/features/debate/types";

interface DebateControlsProps {
  autoContinue: AutoContinueConfig;
  onToggle: () => void;
  onSetMaxRounds: (n: number) => void;
  onStop: () => void;
  onReset: () => void;
  isAnyStreaming: boolean;
}

export function DebateControls({
  autoContinue,
  onToggle,
  onSetMaxRounds,
  onStop,
  onReset,
  isAnyStreaming,
}: DebateControlsProps) {
  const handleIncrement = () => {
    if (autoContinue.maxRounds < 10) {
      onSetMaxRounds(autoContinue.maxRounds + 1);
    }
  };

  const handleDecrement = () => {
    if (autoContinue.maxRounds > 1) {
      onSetMaxRounds(autoContinue.maxRounds - 1);
    }
  };

  return (
    <div className="flex items-center gap-4 border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Switch
          id="auto-continue"
          checked={autoContinue.enabled}
          onCheckedChange={onToggle}
          disabled={isAnyStreaming}
        />
        <Label htmlFor="auto-continue" className="cursor-pointer text-sm">
          Auto-continue
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="max-rounds" className="text-sm text-muted-foreground">
          Max rounds:
        </Label>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={handleDecrement}
            disabled={autoContinue.maxRounds <= 1 || isAnyStreaming}
            aria-label="Decrease max rounds"
          >
            <Minus className="size-3" />
          </Button>
          <Input
            id="max-rounds"
            type="number"
            min={1}
            max={10}
            value={autoContinue.maxRounds}
            onChange={(e) => {
              const val = Number.parseInt(e.target.value, 10);
              if (!Number.isNaN(val) && val >= 1 && val <= 10) {
                onSetMaxRounds(val);
              }
            }}
            disabled={isAnyStreaming}
            className="h-7 w-14 text-center text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={handleIncrement}
            disabled={autoContinue.maxRounds >= 10 || isAnyStreaming}
            aria-label="Increase max rounds"
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {autoContinue.enabled && isAnyStreaming && (
          <Button variant="destructive" size="sm" onClick={onStop} className="gap-1.5">
            <StopCircle className="size-4" />
            Stop
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isAnyStreaming}
          className="gap-1.5"
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
