"use client";

import { useState } from "react";
import { APP_NAME } from "~/lib/constants";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniApp } from "@neynar/react";
import { cn } from "~/lib/utils";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

export function Header({ neynarUser }: HeaderProps) {
  const { context } = useMiniApp();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  return (
    <div className="relative">
      {/* Header Bar */}
      <div
        className={cn(
          "mt-4 mb-4 mx-4 px-3 py-2 rounded-xl",
          "flex items-center justify-between",
          "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md",
          "border border-gray-200 dark:border-gray-800",
          "shadow-md"
        )}
      >
        {/* Left: Greeting */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Welcome to
          </span>
          <span className="text-sm font-medium">
            {APP_NAME}
          </span>
        </div>

        {/* Right: Avatar */}
        {context?.user && (
          <button
            onClick={() => setIsUserDropdownOpen((v) => !v)}
            className="relative focus:outline-none"
          >
            {context.user.pfpUrl && (
              <img
                src={context.user.pfpUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-primary shadow-sm"
              />
            )}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {context?.user && isUserDropdownOpen && (
        <div
          className={cn(
            "absolute right-4 top-full z-50 mt-2 w-56",
            "rounded-xl bg-white dark:bg-gray-900",
            "border border-gray-200 dark:border-gray-800",
            "shadow-lg"
          )}
        >
          <div className="p-4 space-y-2 text-right">
            <h3
              className="font-semibold text-sm hover:underline cursor-pointer"
              onClick={() =>
                sdk.actions.viewProfile({ fid: context.user.fid })
              }
            >
              {context.user.displayName || context.user.username}
            </h3>

            <p className="text-xs text-gray-500">
              @{context.user.username}
            </p>

            <div className="pt-2 space-y-1 text-xs text-gray-500">
              <p>FID: {context.user.fid}</p>
              {neynarUser && (
                <p>Neynar Score: {neynarUser.score}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
