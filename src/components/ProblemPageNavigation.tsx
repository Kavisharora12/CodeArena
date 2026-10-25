import React from "react";
import {
  BookText,
  ClockFading,
  FlaskConical,
  MessageSquareText,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "description", label: "Description", icon: BookText },
  { id: "solutions", label: "Solutions", icon: FlaskConical },
  { id: "discussion", label: "Discussion", icon: MessageSquareText },
  { id: "submissions", label: "Submissions", icon: ClockFading },
  { id: "testResult", label: "Test Result", icon: Terminal },
];

export default function ProblemPageNavigation({
  currentTab,
  setCurrentTab,
}: {
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <nav
      aria-label="Problem workspace tabs"
      className="w-full overflow-x-auto border-b border-border"
    >
      <div className="flex min-w-max gap-1 px-2 sm:px-4">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setCurrentTab(id)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap border-b-2 px-2 py-3 text-xs font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:text-sm",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn("size-4", isActive && "text-primary")}
              />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
