"use client";

import EmojiReactionGame from "~/components/game/EmojiReactionGame";

/**
 * HomeTab component displays the main landing content for the mini app.
 * 
 * This is the default tab that users see when they first open the mini app.
 * It provides a simple welcome message and placeholder content that can be
 * customized for specific use cases.
 * 
 * @example
 * ```tsx
 * <HomeTab />
 * ```
 */
export function HomeTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-6 px-4">
      <EmojiReactionGame />
    </div>
  );
} 