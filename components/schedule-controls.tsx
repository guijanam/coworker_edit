"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Loader2 } from "lucide-react";

interface ScheduleControlsProps {
  monthValue: string;
  onMonthChange: (value: string) => void;
  onSearch: () => void;
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  isLoading: boolean;
}

export function ScheduleControls({
  monthValue,
  onMonthChange,
  onSearch,
  searchFilter,
  onSearchFilterChange,
  isLoading,
}: ScheduleControlsProps) {
  return (
    <div className="flex items-center gap-2 p-3 flex-wrap">
      <ThemeToggle />
      <Input
        type="month"
        value={monthValue}
        onChange={(e) => onMonthChange(e.target.value)}
        className="w-auto"
      />
      <Button onClick={onSearch} disabled={isLoading} size="sm">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "조회"
        )}
      </Button>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="이름으로 검색..."
          value={searchFilter}
          onChange={(e) => onSearchFilterChange(e.target.value)}
          className="pl-8 w-40"
        />
      </div>
    </div>
  );
}
