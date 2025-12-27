"use client";

import React from "react";
import { Home, Compass, ClipboardList, Wallet } from "lucide-react";
import { cn } from "~/lib/utils";
import { Tab } from "~/components/App";

interface FooterProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  showWallet?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ 
  activeTab, 
  setActiveTab, 
  showWallet = false 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200">
      <div className={cn(
        "flex items-center justify-around h-16 ",
        "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md",
        "shadow-lg"
      )}>
        <button
          onClick={() => setActiveTab(Tab.Home)}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors duration-200",
            activeTab === Tab.Home 
              ? "text-primary" 
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          <Home className="w-6 h-6" strokeWidth={activeTab === Tab.Home ? 2.5 : 2} />
        </button>

        <button
          onClick={() => setActiveTab(Tab.Actions)}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors duration-200",
            activeTab === Tab.Actions 
              ? "text-primary" 
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          <Compass className="w-6 h-6" strokeWidth={activeTab === Tab.Actions ? 2.5 : 2} />
        </button>

        <button
          onClick={() => setActiveTab(Tab.Context)}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors duration-200",
            activeTab === Tab.Context 
              ? "text-primary" 
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          <ClipboardList className="w-6 h-6" strokeWidth={activeTab === Tab.Context ? 2.5 : 2} />
        </button>

        {showWallet && (
          <button
            onClick={() => setActiveTab(Tab.Wallet)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-colors duration-200",
              activeTab === Tab.Wallet 
                ? "text-primary" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <Wallet className="w-6 h-6" strokeWidth={activeTab === Tab.Wallet ? 2.5 : 2} />
          </button>
        )}
      </div>
    </div>
  );
};

