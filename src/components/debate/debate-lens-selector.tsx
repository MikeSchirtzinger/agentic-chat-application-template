"use client";

import * as LucideIcons from "lucide-react";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { DebateSide } from "@/features/debate/types";
import type { Lens, PresetLens } from "@/features/lenses/types";
import { isCustomLens } from "@/features/lenses/types";
import { cn } from "@/lib/utils";

interface DebateLensSelectorProps {
  lenses: Lens[];
  activeSide: DebateSide | null;
  leftLensIds: string[];
  rightLensIds: string[];
  onToggleLens: (id: string) => void;
  onOpenBuilder: () => void;
}

export function DebateLensSelector({
  lenses,
  activeSide,
  leftLensIds,
  rightLensIds,
  onToggleLens,
  onOpenBuilder,
}: DebateLensSelectorProps) {
  const presetLenses = lenses.filter((l): l is PresetLens => !isCustomLens(l));
  const customLenses = lenses.filter(isCustomLens);

  const categories = new Map<string, PresetLens[]>();
  for (const lens of presetLenses) {
    const existing = categories.get(lens.category);
    if (existing) {
      existing.push(lens);
    } else {
      categories.set(lens.category, [lens]);
    }
  }

  const activeLensIds =
    activeSide === "left" ? leftLensIds : activeSide === "right" ? rightLensIds : [];

  const renderLensBadge = (lens: Lens) => {
    const isActive = activeLensIds.includes(lens.id);
    const isOnLeft = leftLensIds.includes(lens.id);
    const isOnRight = rightLensIds.includes(lens.id);
    const Icon =
      (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[lens.icon] ??
      LucideIcons.Sparkles;

    return (
      <Badge
        key={lens.id}
        variant={isActive ? "default" : "outline"}
        className={cn(
          "cursor-pointer whitespace-nowrap transition-all relative",
          isActive && "lens-badge-active",
          !activeSide && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => activeSide && onToggleLens(lens.id)}
      >
        <Icon className="mr-1.5 size-3" />
        {lens.name}
        {isOnLeft && isOnRight && (
          <span className="ml-1.5 flex gap-0.5">
            <span className="size-1.5 rounded-full bg-blue-500" />
            <span className="size-1.5 rounded-full bg-amber-500" />
          </span>
        )}
        {isOnLeft && !isOnRight && <span className="ml-1.5 size-1.5 rounded-full bg-blue-500" />}
        {isOnRight && !isOnLeft && <span className="ml-1.5 size-1.5 rounded-full bg-amber-500" />}
      </Badge>
    );
  };

  return (
    <div className="border-t border-border/50 px-4 py-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {activeSide ? (
            <>
              Editing{" "}
              <span
                className={
                  activeSide === "left"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-amber-600 dark:text-amber-400"
                }
              >
                {activeSide === "left" ? "Left" : "Right"} Side
              </span>{" "}
              lenses
            </>
          ) : (
            "Select a side to assign lenses"
          )}
        </p>
      </div>
      <ScrollArea className="lens-selector-scroll w-full">
        <div className="flex items-center gap-2">
          {Array.from(categories.entries()).map(([category, categoryLenses], index) => (
            <div key={category} className="flex items-center gap-2">
              {index > 0 && <Separator orientation="vertical" className="h-6" />}
              {categoryLenses.map(renderLensBadge)}
            </div>
          ))}

          {customLenses.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">{customLenses.map(renderLensBadge)}</div>
            </>
          )}

          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={onOpenBuilder}
          >
            <Plus className="size-3" />
            Custom
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
