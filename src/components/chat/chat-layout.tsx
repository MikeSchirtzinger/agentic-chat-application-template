"use client";

import { MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CustomLensBuilder } from "@/components/lenses/custom-lens-builder";
import { LensSelector } from "@/components/lenses/lens-selector";
import { ThinkingTracePanel } from "@/components/lenses/thinking-trace-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@/hooks/use-chat";
import { useLenses } from "@/hooks/use-lenses";

import type { AppMode } from "./chat-header";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { MessageList } from "./message-list";

function DebateModeWrapper() {
  const { DebateLayout } = require("@/components/debate/debate-layout");
  const { useDebate } = require("@/hooks/use-debate");
  const debate = useDebate();

  return <DebateLayout debate={debate} />;
}

export function ChatLayout() {
  const {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    isLoadingMessages,
    streamingContent,
    sendMessage,
    selectConversation,
    createNewChat,
    renameConversation,
    deleteConversation,
  } = useChat();

  const { allLenses, activeLensIds, activeLenses, composedPrompt, toggleLens, addCustomLens } =
    useLenses(activeConversationId);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [mode, setMode] = useState<AppMode>("chat");

  useEffect(() => {
    const stored = localStorage.getItem("app-mode");
    if (stored === "chat" || stored === "debate") {
      setMode(stored);
    }
  }, []);

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
    localStorage.setItem("app-mode", newMode);
  }, []);

  const activeTitle = conversations.find((c) => c.id === activeConversationId)?.title ?? null;

  const toggleSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleTrace = useCallback(() => {
    setIsTraceOpen((prev) => !prev);
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      void sendMessage(content, activeLensIds);
    },
    [sendMessage, activeLensIds],
  );

  const hasMessages = messages.length > 0 || isStreaming;

  if (mode === "debate") {
    return (
      <div className="flex h-screen">
        <div className="chat-gradient-bg flex flex-1 flex-col">
          <ChatHeader
            title={null}
            onToggleSidebar={toggleSidebar}
            activeLensCount={0}
            onToggleTrace={toggleTrace}
            isTraceOpen={false}
            mode={mode}
            onModeChange={handleModeChange}
          />
          <DebateModeWrapper />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewChat={createNewChat}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
        isMobileOpen={isMobileOpen}
        onMobileClose={closeMobile}
      />

      <div className="chat-gradient-bg flex flex-1 flex-col">
        <ChatHeader
          title={activeTitle}
          onToggleSidebar={toggleSidebar}
          activeLensCount={activeLensIds.length}
          onToggleTrace={toggleTrace}
          isTraceOpen={isTraceOpen}
          mode={mode}
          onModeChange={handleModeChange}
        />

        {isLoadingMessages && activeConversationId ? (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-4 py-4">
              <div className="flex gap-3 px-4 py-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <Skeleton className="h-16 w-3/4 rounded-2xl" />
              </div>
              <div className="flex flex-row-reverse gap-3 px-4 py-3">
                <Skeleton className="h-10 w-1/2 rounded-2xl" />
              </div>
              <div className="flex gap-3 px-4 py-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <Skeleton className="h-24 w-2/3 rounded-2xl" />
              </div>
              <div className="flex flex-row-reverse gap-3 px-4 py-3">
                <Skeleton className="h-10 w-2/5 rounded-2xl" />
              </div>
            </div>
          </div>
        ) : hasMessages ? (
          <MessageList
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="bg-primary/10 flex size-16 items-center justify-center rounded-2xl">
              <MessageSquare className="text-primary size-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">How can I help you today?</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Start a conversation by typing a message below.
              </p>
            </div>
          </div>
        )}

        <LensSelector
          lenses={allLenses}
          activeLensIds={activeLensIds}
          onToggleLens={toggleLens}
          onOpenBuilder={() => setIsBuilderOpen(true)}
        />

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>

      <ThinkingTracePanel
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
        activeLenses={activeLenses}
        composedPrompt={composedPrompt}
        onToggleLens={toggleLens}
      />

      <CustomLensBuilder
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        onLensCreated={addCustomLens}
      />
    </div>
  );
}
