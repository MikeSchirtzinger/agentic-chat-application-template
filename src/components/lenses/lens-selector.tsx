"use client";

import * as LucideIcons from "lucide-react";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Lens, PresetLens } from "@/features/lenses/types";
import { isCustomLens } from "@/features/lenses/types";

interface LensSelectorProps {
  lenses: Lens[];
  activeLensIds: string[];
  onToggleLens: (id: string) => void;
  onOpenBuilder: () => void;
}

export function LensSelector({
  lenses,
  activeLensIds,
  onToggleLens,
  onOpenBuilder,
}: LensSelectorProps) {
  // Group preset lenses by category
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

  const renderLensBadge = (lens: Lens) => {
    const isActive = activeLensIds.includes(lens.id);
    const Icon =
      (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[lens.icon] ??
      LucideIcons.Sparkles;

    return (
      <Badge
        key={lens.id}
        variant={isActive ? "default" : "outline"}
        className={`cursor-pointer whitespace-nowrap transition-all ${isActive ? "lens-badge-active" : ""}`}
        onClick={() => onToggleLens(lens.id)}
      >
        <Icon className="mr-1.5 size-3" />
        {lens.name}
      </Badge>
    );
  };

  return (
    <div className="border-t border-border/50 px-4 py-2">
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
