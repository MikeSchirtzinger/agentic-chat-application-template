"use client";

import * as LucideIcons from "lucide-react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Lens } from "@/features/lenses/types";

interface ThinkingTracePanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeLenses: Lens[];
  composedPrompt: string;
  onToggleLens: (id: string) => void;
}

export function ThinkingTracePanel({
  isOpen,
  onClose,
  activeLenses,
  composedPrompt,
  onToggleLens,
}: ThinkingTracePanelProps) {
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Thinking Trace</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close trace panel">
          <X className="size-4" />
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium">Active Lenses</h3>
              {activeLenses.length === 0 ? (
                <p className="text-muted-foreground text-sm">No lenses active</p>
              ) : (
                <div className="space-y-2">
                  {activeLenses.map((lens) => {
                    const Icon =
                      (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
                        lens.icon
                      ] ?? LucideIcons.Sparkles;
                    return (
                      <div
                        key={lens.id}
                        className="bg-muted/50 flex items-center justify-between rounded-lg p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span className="text-sm font-medium">{lens.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => onToggleLens(lens.id)}
                          aria-label={`Remove ${lens.name}`}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 text-sm font-medium">Composed System Prompt</h3>
              <ScrollArea className="bg-muted h-[calc(100vh-24rem)] rounded-lg">
                <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                  {composedPrompt || "No lenses active — using default behavior"}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Thinking Trace</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{content}</div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed Panel */}
      {isOpen && <div className="thinking-trace-panel hidden w-80 md:block">{content}</div>}
    </>
  );
}
