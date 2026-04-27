"use client";

import { cn } from "@/lib/utils";
import type { PositionTab } from "@/lib/types";

interface BottomTabsProps {
  selectedTab: PositionTab;
  onTabChange: (tab: PositionTab) => void;
}

export function BottomTabs({ selectedTab, onTabChange }: BottomTabsProps) {
  const tabs: { label: string; value: PositionTab }[] = [
    { label: "기관사", value: "기관사" },
    { label: "차장", value: "차장" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 flex border-t bg-background">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={cn(
            "flex-1 py-3 font-bold text-sm transition-colors",
            selectedTab === tab.value
              ? "border-b-2 border-primary bg-accent"
              : "text-muted-foreground"
          )}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
