"use client";

import { Brain, Menu } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  title: string | null;
  onToggleSidebar: () => void;
  activeLensCount: number;
  onToggleTrace: () => void;
  isTraceOpen: boolean;
}

export function ChatHeader({
  title,
  onToggleSidebar,
  activeLensCount,
  onToggleTrace,
  isTraceOpen,
}: ChatHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="truncate text-lg font-semibold">{title ?? "New Chat"}</h1>
        {activeLensCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeLensCount} {activeLensCount === 1 ? "lens" : "lenses"}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={isTraceOpen ? "default" : "ghost"}
          size="icon"
          onClick={onToggleTrace}
          aria-label="Toggle thinking trace"
        >
          <Brain className="size-5" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
